
"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
import { Logo } from "../logo";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/context/i18n-context";
import { signInWithEmail } from "@/services/auth-service";
import { Loader2, Eye, EyeOff } from "lucide-react";
import { getFirebaseAuthErrorMessage } from "@/lib/firebase-errors";

export function LoginForm() {
  const { t, language } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const formSchema = z.object({
    email: z.string().email({
      message: t("auth.error.invalidEmail"),
    }),
    password: z.string().min(1, {
      message: t("auth.error.passwordRequired"),
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signInWithEmail(values.email, values.password);
      toast({
        title: t("auth.login.successTitle"),
        description: t("auth.login.successDescription"),
      });
      router.push("/dashboard");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: t("auth.error.loginFailed"),
        description: getFirebaseAuthErrorMessage(error.code, language),
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md space-y-6">
        <div className="text-center">
            <h1 className="font-headline text-3xl font-bold tracking-tight">{t('auth.login.title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('auth.login.description')}</p>
        </div>
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
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>{t('auth.password')}</FormLabel>
                    <Link
                      href="/auth/forgot-password"
                      className="text-sm font-medium text-primary hover:underline"
                    >
                      {t('auth.forgotPasswordLink')}
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        type={showPassword ? "text" : "password"}
                        placeholder="********"
                        {...field}
                      />
                       <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute inset-y-0 right-0 h-full px-3"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {showPassword ? "Ocultar senha" : "Mostrar senha"}
                        </span>
                      </Button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.login.button')}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {t('auth.noAccount')}{" "}
          <Link href="/auth/signup" className="font-medium text-primary hover:underline">
            {t('auth.signUpLink')}
          </Link>
        </div>
      </div>
  );
}
