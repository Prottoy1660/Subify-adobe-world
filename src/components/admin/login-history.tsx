'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { formatDate } from '@/lib/utils';
import type { LoginInfo } from '@/types';
import { getAllLoginHistory, getResellerById } from '@/lib/data-service';
import { Globe, Monitor, Smartphone, Laptop, AlertTriangle, User } from 'lucide-react';

export function LoginHistory() {
  const [loginHistory, setLoginHistory] = useState<LoginInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [userDetails, setUserDetails] = useState<Record<string, { email: string; phone: string; name?: string }>>({});

  useEffect(() => {
    const loadLoginHistory = async () => {
      try {
        const history = await getAllLoginHistory();
        setLoginHistory(history);

        // Fetch user details for each unique user ID
        const uniqueUserIds = [...new Set(history.map(login => login.userId))];
        const details: Record<string, { email: string; phone: string; name?: string }> = {};
        
        for (const userId of uniqueUserIds) {
          const user = await getResellerById(userId);
          if (user) {
            details[userId] = {
              email: user.email,
              phone: user.phone,
              name: user.name
            };
          }
        }
        
        setUserDetails(details);
      } catch (error) {
        console.error('Error loading login history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadLoginHistory();
  }, []);

  const filteredHistory = loginHistory.filter(login => {
    const userDetail = userDetails[login.userId];
    return (
      login.userId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.ipAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.deviceInfo.browser.toLowerCase().includes(searchTerm.toLowerCase()) ||
      login.deviceInfo.os.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (userDetail?.email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userDetail?.phone?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (userDetail?.name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="h-4 w-4" />;
      case 'tablet':
        return <Laptop className="h-4 w-4" />;
      case 'desktop':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  return (
    <Card className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Login History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <Input
            placeholder="Search by user ID, email, phone, name, IP, browser, or OS..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />

          <Tabs defaultValue="all" className="w-full">
            <TabsList>
              <TabsTrigger value="all">All Logins</TabsTrigger>
              <TabsTrigger value="admin">Admin Logins</TabsTrigger>
              <TabsTrigger value="reseller">Reseller Logins</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              {filteredHistory.map((login) => {
                const userDetail = userDetails[login.userId];
                return (
                  <Card key={login.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">User Details</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>{userDetail?.name || 'Unknown Name'}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{userDetail?.email || 'No Email'}</p>
                        <p className="text-sm text-muted-foreground">{userDetail?.phone || 'No Phone'}</p>
                        <Badge variant={login.userRole === 'admin' ? 'default' : 'secondary'}>
                          {login.userRole}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Device & Browser</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getDeviceIcon(login.deviceInfo.deviceType)}
                          <span>{login.deviceInfo.browser} {login.deviceInfo.browserVersion}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {login.deviceInfo.os} {login.deviceInfo.osVersion}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Location & Time</p>
                        <p className="text-sm text-muted-foreground">
                          IP: {login.ipAddress}
                        </p>
                        {login.location?.country && (
                          <p className="text-sm text-muted-foreground">
                            {login.location.city}, {login.location.country}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatDate(login.timestamp)}
                        </p>
                      </div>
                    </div>
                    {login.status === 'failed' && (
                      <div className="mt-2 flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm">Failed: {login.failureReason}</p>
                      </div>
                    )}
                  </Card>
                );
              })}
            </TabsContent>

            <TabsContent value="admin" className="space-y-4">
              {filteredHistory
                .filter(login => login.userRole === 'admin')
                .map((login) => (
                  <Card key={login.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">User</p>
                        <p className="text-sm text-muted-foreground">{login.userId}</p>
                        <Badge variant={login.userRole === 'admin' ? 'default' : 'secondary'}>
                          {login.userRole}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Device & Browser</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getDeviceIcon(login.deviceInfo.deviceType)}
                          <span>{login.deviceInfo.browser} {login.deviceInfo.browserVersion}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {login.deviceInfo.os} {login.deviceInfo.osVersion}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Location & Time</p>
                        <p className="text-sm text-muted-foreground">
                          IP: {login.ipAddress}
                        </p>
                        {login.location?.country && (
                          <p className="text-sm text-muted-foreground">
                            {login.location.city}, {login.location.country}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatDate(login.timestamp)}
                        </p>
                      </div>
                    </div>
                    {login.status === 'failed' && (
                      <div className="mt-2 flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm">Failed: {login.failureReason}</p>
                      </div>
                    )}
                  </Card>
                ))}
            </TabsContent>

            <TabsContent value="reseller" className="space-y-4">
              {filteredHistory
                .filter(login => login.userRole === 'reseller')
                .map((login) => (
                  <Card key={login.id} className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium">User</p>
                        <p className="text-sm text-muted-foreground">{login.userId}</p>
                        <Badge variant={login.userRole === 'admin' ? 'default' : 'secondary'}>
                          {login.userRole}
                        </Badge>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Device & Browser</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          {getDeviceIcon(login.deviceInfo.deviceType)}
                          <span>{login.deviceInfo.browser} {login.deviceInfo.browserVersion}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {login.deviceInfo.os} {login.deviceInfo.osVersion}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Location & Time</p>
                        <p className="text-sm text-muted-foreground">
                          IP: {login.ipAddress}
                        </p>
                        {login.location?.country && (
                          <p className="text-sm text-muted-foreground">
                            {login.location.city}, {login.location.country}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground">
                          {formatDate(login.timestamp)}
                        </p>
                      </div>
                    </div>
                    {login.status === 'failed' && (
                      <div className="mt-2 flex items-center gap-2 text-destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm">Failed: {login.failureReason}</p>
                      </div>
                    )}
                  </Card>
                ))}
            </TabsContent>
          </Tabs>
        </div>
      </CardContent>
    </Card>
  );
} 