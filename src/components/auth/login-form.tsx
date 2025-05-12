'use client';

import { useActionState, useEffect, useTransition } from 'react'; 
import { useFormStatus } from 'react-dom';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, LogIn, Loader2 } from 'lucide-react'; 
import { handleLogin } from '@/app/actions';
import { REGISTER_PATH } from '@/lib/constants'; 
import { useToast } from '@/hooks/use-toast'; 

const LoginSchema = z.object({
  identifier: z.string().min(1, { message: 'Email or phone is required.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

type LoginFormValues = z.infer<typeof LoginSchema>;

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
          <LogIn className="mr-2 h-4 w-4" /> Login
        </>
      )}
    </Button>
  );
}

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [state, formAction] = useActionState(handleLogin, initialState); 
  const { toast } = useToast(); 

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(LoginSchema),
    defaultValues: {
      identifier: '',
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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.append('userAgent', navigator.userAgent);
    
    // Get IP address using a third-party service
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      formData.append('ipAddress', data.ip);
    } catch (error) {
      console.error('Failed to get IP address:', error);
      formData.append('ipAddress', 'unknown');
    }

    startTransition(() => {
      formAction(formData);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-100">
        <Label htmlFor="identifier">Email or Phone</Label>
        <Input
          id="identifier"
          type="text"
          placeholder="Enter your email or phone number"
          required
          {...form.register('identifier')}
        />
        {form.formState.errors.identifier && (
          <p className="text-sm text-destructive">{form.formState.errors.identifier.message}</p>
        )}
        {state?.errors?.identifier && (
          <p className="text-sm text-destructive">{state.errors.identifier[0]}</p>
        )}
      </div>

      <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-300 delay-200">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
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
      
      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 delay-300">
        <SubmitButton />
      </div>

      <p className="text-center text-sm text-muted-foreground animate-in fade-in duration-300 delay-400">
        Don&apos;t have an account?{' '}
        <Link href={REGISTER_PATH} className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </form>
  );
}
