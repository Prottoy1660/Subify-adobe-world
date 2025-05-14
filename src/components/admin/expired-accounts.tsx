'use client';

import React, { useEffect, useState } from 'react';
import { getExpiringSubmissions, updateSubmissionStatus } from '@/lib/data-service';
import type { Submission } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDate, addMonths } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, AlertTriangle, CalendarClock, Infinity } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

export function ExpiredAccounts() {
  const [expiredAccounts, setExpiredAccounts] = useState<Submission[]>([]);
  const [expiredCount, setExpiredCount] = useState(0);
  const [expiringSoonCount, setExpiringSoonCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Submission | null>(null);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = useState(false);
  const [renewalMonths, setRenewalMonths] = useState(1);
  const { toast } = useToast();

  const fetchExpiredAccounts = async () => {
    const accounts = await getExpiringSubmissions();
    setExpiredAccounts(accounts);
    const now = new Date();
    const expired = accounts.filter(account => account.endDate && new Date(account.endDate) < now);
    const expiringSoon = accounts.filter(account => {
      if (!account.endDate) return false;
      const endDate = new Date(account.endDate);
      const daysLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return daysLeft > 0 && daysLeft <= 7;
    });
    setExpiredCount(expired.length);
    setExpiringSoonCount(expiringSoon.length);
  };

  useEffect(() => {
    fetchExpiredAccounts();
  }, []);

  const handleRenew = async () => {
    if (!selectedAccount?.endDate) return;

    setIsLoading(true);
    try {
      const updatedSubmission = await updateSubmissionStatus(
        selectedAccount.id,
        'Successful',
        renewalMonths
      );
      
      if (updatedSubmission) {
        await fetchExpiredAccounts();
        toast({
          title: "Success",
          description: `Package has been renewed for ${renewalMonths} month${renewalMonths > 1 ? 's' : ''}`,
        });
        setIsRenewDialogOpen(false);
        setSelectedAccount(null);
        setRenewalMonths(1);
      } else {
        throw new Error('Failed to renew package');
      }
    } catch (error) {
      console.error('Error renewing package:', error);
      toast({
        title: "Error",
        description: "Failed to renew package. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (account: Submission) => {
    if (!account.endDate) return null;
    const now = new Date();
    const endDate = new Date(account.endDate);
    const daysLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

    if (daysLeft < 0) {
      return (
        <Badge variant="destructive" className="animate-pulse">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Expired
        </Badge>
      );
    }
    if (daysLeft <= 7) {
      return (
        <Badge variant="secondary" className="animate-pulse bg-yellow-500 text-white">
          <CalendarClock className="h-3 w-3 mr-1" />
          Expiring Soon
        </Badge>
      );
    }
    return (
      <Badge variant="default">
        <CalendarClock className="h-3 w-3 mr-1" />
        Active
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-red-50 border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-red-700 flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Expired Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-red-700">{expiredCount}</p>
            <p className="text-sm text-red-600">Accounts that need immediate attention</p>
          </CardContent>
        </Card>

        <Card className="bg-yellow-50 border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-yellow-700 flex items-center gap-2">
              <CalendarClock className="h-5 w-5" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-700">{expiringSoonCount}</p>
            <p className="text-sm text-yellow-600">Accounts expiring within 7 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All Accounts</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-4">
      <div className="rounded-lg border shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer Email</TableHead>
              <TableHead>End Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Progress</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expiredAccounts.map((account) => {
              if (!account.endDate) return null;
              const endDate = new Date(account.endDate);
              const now = new Date();
              const daysLeft = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
              const progress = Math.max(0, Math.min(100, (daysLeft / 30) * 100));
              return (
                    <TableRow 
                      key={account.id}
                      className={cn(
                        "transition-all duration-300",
                        daysLeft < 0 && "bg-red-50",
                        daysLeft <= 7 && daysLeft > 0 && "bg-yellow-50"
                      )}
                    >
                      <TableCell className="font-medium">{account.customerEmail}</TableCell>
                      <TableCell>
                        {account.endDate === 'unlimited' ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <Infinity className="h-4 w-4" />
                            <span>Unlimited</span>
                          </div>
                        ) : (
                          formatDate(account.endDate)
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(account)}</TableCell>
                      <TableCell>
                        {account.endDate === 'unlimited' ? (
                          <div className="flex items-center gap-2 text-green-600">
                            <Infinity className="h-4 w-4" />
                            <span>Unlimited</span>
                          </div>
                        ) : (
                          <Progress 
                            value={progress} 
                            className={cn(
                              "w-full",
                              daysLeft < 0 && "bg-red-200",
                              daysLeft <= 7 && daysLeft > 0 && "bg-yellow-200"
                            )}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsRenewDialogOpen(true);
                          }}
                          className="text-green-700 hover:text-green-800 hover:bg-green-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renew
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="expired" className="mt-4">
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Email</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredAccounts
                  .filter(account => account.endDate && new Date(account.endDate) < new Date())
                  .map((account) => (
                    <TableRow 
                      key={account.id}
                      className="bg-red-50 transition-all duration-300"
                    >
                      <TableCell className="font-medium">{account.customerEmail}</TableCell>
                      <TableCell>{formatDate(account.endDate!)}</TableCell>
                      <TableCell>{getStatusBadge(account)}</TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedAccount(account);
                            setIsRenewDialogOpen(true);
                          }}
                          className="text-green-700 hover:text-green-800 hover:bg-green-50"
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Renew
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        <TabsContent value="expiring" className="mt-4">
          <div className="rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer Email</TableHead>
                  <TableHead>End Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {expiredAccounts
                  .filter(account => {
                    if (!account.endDate) return false;
                    const endDate = new Date(account.endDate);
                    const daysLeft = (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
                    return daysLeft > 0 && daysLeft <= 7;
                  })
                  .map((account) => {
                    const endDate = new Date(account.endDate!);
                    const daysLeft = (endDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24);
                    const progress = Math.max(0, Math.min(100, (daysLeft / 30) * 100));
                    return (
                      <TableRow 
                        key={account.id}
                        className="bg-yellow-50 transition-all duration-300"
                      >
                        <TableCell className="font-medium">{account.customerEmail}</TableCell>
                        <TableCell>{formatDate(account.endDate!)}</TableCell>
                        <TableCell>{getStatusBadge(account)}</TableCell>
                  <TableCell>
                          <Progress 
                            value={progress} 
                            className="w-full bg-yellow-200"
                          />
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedAccount(account);
                        setIsRenewDialogOpen(true);
                      }}
                      className="text-green-700 hover:text-green-800 hover:bg-green-50"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Renew
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isRenewDialogOpen} onOpenChange={setIsRenewDialogOpen}>
        <DialogContent className="animate-in zoom-in-95 duration-200">
          <DialogHeader>
            <DialogTitle>Renew Package</DialogTitle>
            <DialogDescription>
              Renew the package for the selected customer.
            </DialogDescription>
          </DialogHeader>
          {selectedAccount && selectedAccount.endDate && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Customer Email</Label>
                <p className="text-sm text-muted-foreground">{selectedAccount.customerEmail}</p>
              </div>
              <div className="space-y-2">
                <Label>Current Expiry</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedAccount.endDate === 'unlimited' ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Infinity className="h-4 w-4" />
                      <span>Unlimited</span>
                    </div>
                  ) : (
                    formatDate(selectedAccount.endDate)
                  )}
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="months">Renewal Duration (Months)</Label>
                <Input
                  id="months"
                  type="number"
                  min="1"
                  max="120"
                  value={renewalMonths}
                  onChange={(e) => setRenewalMonths(parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label>New Expiry Date</Label>
                <p className="text-sm text-muted-foreground">
                  {selectedAccount.endDate === 'unlimited' ? (
                    <div className="flex items-center gap-2 text-green-600">
                      <Infinity className="h-4 w-4" />
                      <span>Unlimited</span>
                    </div>
                  ) : (
                    formatDate(addMonths(new Date(selectedAccount.endDate), renewalMonths).toISOString())
                  )}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRenewDialogOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenew}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Renewing...
                </>
              ) : (
                <>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Renew Package
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 