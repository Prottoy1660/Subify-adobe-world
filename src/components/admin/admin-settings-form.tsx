'use client';

import { useActionState, useTransition } from 'react';
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Save } from 'lucide-react';

const SettingsSchema = z.object({
  // General Settings
  siteName: z.string().min(1, { message: 'Site name is required.' }),
  maintenanceMode: z.boolean(),
  
  // Security Settings
  enableTwoFactor: z.boolean(),
  sessionTimeout: z.coerce.number().int().min(5).max(120),
  
  // Notification Settings
  emailNotifications: z.boolean(),
  notifyOnNewCustomer: z.boolean(),
  notifyOnPayment: z.boolean(),
  
  // AI Settings
  enableAIPrediction: z.boolean(),
  aiConfidenceThreshold: z.coerce.number().int().min(0).max(100),
});

type SettingsFormValues = z.infer<typeof SettingsSchema>;

const initialState = {
  message: '',
  errors: {} as Record<string, string[] | undefined>,
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="transition-transform hover:scale-[1.02] active:scale-[0.98]" disabled={pending}>
      {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Save className="mr-2 h-4 w-4" />
      )}
      {pending ? 'Saving...' : 'Save Changes'}
    </Button>
  );
}

export function AdminSettingsForm() {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(async (prevState: any, formData: FormData) => {
    // TODO: Implement settings update logic
    return { message: 'Settings updated successfully.' };
  }, initialState);
  
  const { toast } = useToast();

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(SettingsSchema),
    defaultValues: {
      siteName: 'My Admin Panel',
      maintenanceMode: false,
      enableTwoFactor: false,
      sessionTimeout: 30,
      emailNotifications: true,
      notifyOnNewCustomer: true,
      notifyOnPayment: true,
      enableAIPrediction: true,
      aiConfidenceThreshold: 75,
    },
  });

  useEffect(() => {
    if (state?.message) {
      toast({
        title: state.errors && Object.keys(state.errors).length > 0 ? 'Error' : 'Success',
        description: state.message,
        variant: state.errors && Object.keys(state.errors).length > 0 ? 'destructive' : 'default',
      });
    }
  }, [state, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg animate-in fade-in zoom-in-95 duration-300">
      <CardHeader className="animate-in fade-in slide-in-from-top-2 duration-300 delay-100">
        <CardTitle className="text-2xl">Admin Settings</CardTitle>
        <CardDescription>Configure your admin panel settings and preferences.</CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent>
          <Tabs defaultValue="general" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="notifications">Notifications</TabsTrigger>
              <TabsTrigger value="ai">AI Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="siteName">Site Name</Label>
                <Input
                  id="siteName"
                  {...form.register('siteName')}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="maintenanceMode"
                  {...form.register('maintenanceMode')}
                />
                <Label htmlFor="maintenanceMode">Maintenance Mode</Label>
              </div>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableTwoFactor"
                  {...form.register('enableTwoFactor')}
                />
                <Label htmlFor="enableTwoFactor">Enable Two-Factor Authentication</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                <Input
                  id="sessionTimeout"
                  type="number"
                  {...form.register('sessionTimeout')}
                />
              </div>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="emailNotifications"
                  {...form.register('emailNotifications')}
                />
                <Label htmlFor="emailNotifications">Enable Email Notifications</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyOnNewCustomer"
                  {...form.register('notifyOnNewCustomer')}
                />
                <Label htmlFor="notifyOnNewCustomer">Notify on New Customer</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="notifyOnPayment"
                  {...form.register('notifyOnPayment')}
                />
                <Label htmlFor="notifyOnPayment">Notify on Payment</Label>
              </div>
            </TabsContent>

            <TabsContent value="ai" className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="enableAIPrediction"
                  {...form.register('enableAIPrediction')}
                />
                <Label htmlFor="enableAIPrediction">Enable AI Prediction</Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="aiConfidenceThreshold">AI Confidence Threshold (%)</Label>
                <Input
                  id="aiConfidenceThreshold"
                  type="number"
                  {...form.register('aiConfidenceThreshold')}
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
        <CardFooter className="flex justify-end animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300">
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
} 