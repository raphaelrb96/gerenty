
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useState } from "react";
import { useTranslation } from "@/context/i18n-context";
import { useToast } from "@/hooks/use-toast";
import { resetPassword } from "@/services/auth-service";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-errors";


export function ForgotPasswordForm() {
  const { t, language } = useTranslation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const formSchema = z.object({
    email: z.string().email({
      message: t("auth.error.invalidEmail"),
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await resetPassword(values.email);
      setSubmitted(true);
    } catch (error: any) {
        console.error(error);
        toast({
            variant: "destructive",
            title: t("auth.error.resetPasswordFailed"),
            description: getFirebaseAuthErrorMessage(error.code, language),
        })
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
        <div className="text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tight">{t('auth.forgotPassword.title')}</h1>
            <p className="mt-2 text-muted-foreground">
                {submitted
                    ? t('auth.forgotPassword.submittedDescription')
                    : t('auth.forgotPassword.description')}
            </p>
        </div>
        
        {!submitted ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('auth.email')}</FormLabel>
                    <FormControl>
                      <Input placeholder="name@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('auth.forgotPassword.button')}
              </Button>
            </form>
          </Form>
        ) : null}

        <div className="mt-4 text-center text-sm">
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
             {t('auth.backToLogin')}
          </Link>
        </div>
      </div>
  );
}
