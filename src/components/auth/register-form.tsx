'use client';

import { useActionState, useEffect } from 'react'; 
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, UserPlus, Loader2 } from 'lucide-react'; 
import { handleRegister } from '@/app/actions';
import { LOGIN_PATH } from '@/lib/constants'; 
import { useToast } from '@/hooks/use-toast'; 

const RegisterSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  email: z.string().email({ message: 'Please enter a valid email.' }),
  phone: z.string().min(7, { message: 'Please enter a valid phone number.' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters.' }),
});

type RegisterFormValues = z.infer<typeof RegisterSchema>;

const initialState = {
  message: '',
  errors: {} as Record<string, string[] | undefined>, 
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full transition-transform hover:scale-[1.02] active:scale-[0.98]" disabled={pending}>
       {pending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <>
         <UserPlus className="mr-2 h-4 w-4" /> Register
        </>
      )}
    </Button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(handleRegister, initialState); 
  const { toast } = useToast(); 

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(RegisterSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
    },
  });

  useEffect(() => {
    if (state?.message && !state.message.toLowerCase().includes('successful')) { 
      toast({
        title: state.errors && Object.keys(state.errors).length > 0 ? 'Error' : 'Notification',
        description: state.message,
        variant: state.errors && Object.keys(state.errors).length > 0 ? 'destructive' : 'default',
      });
    }
  }, [state, toast]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          name="name"
          required
          {...form.register('name')}
        />
        {form.formState.errors.name && (
          <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
        )}
        {state?.errors?.name && (
          <p className="text-sm text-destructive">{state.errors.name[0]}</p>
        )}
      </div>

      <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="login@subifybd.com"
          required
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>
        )}
        {state?.errors?.email && (
          <p className="text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>

      <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
        <Label htmlFor="phone">Phone Number</Label>
        <Input
          id="phone"
          name="phone"
          type="tel"
          placeholder="e.g. 017XXXXXXXX"
          required
          {...form.register('phone')}
        />
        {form.formState.errors.phone && (
          <p className="text-sm text-destructive">{form.formState.errors.phone.message}</p>
        )}
        {state?.errors?.phone && (
          <p className="text-sm text-destructive">{state.errors.phone[0]}</p>
        )}
      </div>

      <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-sm text-destructive">{form.formState.errors.password.message}</p>
        )}
        {state?.errors?.password && (
          <p className="text-sm text-destructive">{state.errors.password[0]}</p>
        )}
      </div>
      
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-400">
        <SubmitButton />
      </div>

      <p className="text-center text-sm text-muted-foreground animate-in fade-in duration-300 delay-400">
        Already have an account?{' '}
        <Link href={LOGIN_PATH} className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
