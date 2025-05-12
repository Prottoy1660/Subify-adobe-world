
import type React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe } from 'lucide-react'; 

interface AuthFormWrapperProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function AuthFormWrapper({ title, description, children }: AuthFormWrapperProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md shadow-xl animate-in fade-in zoom-in-95 duration-300">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground animate-in fade-in zoom-in-90 delay-100 duration-300">
            <Globe className="h-8 w-8" /> 
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight animate-in fade-in slide-in-from-bottom-2 delay-150 duration-300">{title}</CardTitle>
          <CardDescription className="text-muted-foreground animate-in fade-in slide-in-from-bottom-2 delay-200 duration-300">{description}</CardDescription>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}
