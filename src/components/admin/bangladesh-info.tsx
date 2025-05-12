'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';

export function BangladeshInfo() {
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    // Update time every second
    const timeInterval = setInterval(() => {
      const bangladeshTime = formatInTimeZone(new Date(), 'Asia/Dhaka', 'h:mm:ss a');
      setTime(bangladeshTime);
    }, 1000);

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  return (
    <Card className="mb-6 animate-in fade-in slide-in-from-top-4 duration-500">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">Bangladesh Time</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Clock className="h-5 w-5 text-primary" />
          <div>
            <p className="text-sm text-muted-foreground">Current Time (BD)</p>
            <p className="text-lg font-semibold">{time}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 