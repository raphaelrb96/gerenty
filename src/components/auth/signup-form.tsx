
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Logo } from "../logo";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/context/i18n-context";
import { signUpWithEmail } from "@/services/auth-service";
import { Loader2 } from "lucide-react";

export function SignupForm() {
  const { t } = useTranslation();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const formSchema = z.object({
    name: z.string().min(2, {
      message: t("auth.error.nameRequired"),
    }),
    email: z.string().email({
      message: t("auth.error.invalidEmail"),
    }),
    password: z.string().min(8, {
      message: t("auth.error.passwordLength"),
    }),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);
    try {
      await signUpWithEmail(values.name, values.email, values.password);
      toast({
        title: t("auth.signup.successTitle"),
        description: t("auth.signup.successDescription"),
      });
      router.push("/dashboard");
    } catch (error: any) {
        console.error(error)
        let description = t("auth.error.generic");
        if (error.code === 'auth/email-already-in-use') {
            description = t("auth.error.emailInUse");
        }
        toast({
            variant: "destructive",
            title: t("auth.error.signupFailed"),
            description: description,
        });
    } finally {
        setIsLoading(false);
    }
  }

  return (
    <Card className="mx-auto w-full max-w-sm p-4 sm:p-6">
      <CardHeader className="text-center">
        <Logo className="mb-4 justify-center" />
        <CardTitle className="font-headline text-2xl">{t('auth.signup.title')}</CardTitle>
        <CardDescription>
          {t('auth.signup.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('auth.fullName')}</FormLabel>
                  <FormControl>
                    <Input placeholder={t('auth.fullNamePlaceholder')} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
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
                  <FormLabel>{t('auth.password')}</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t('auth.signup.button')}
            </Button>
          </form>
        </Form>
        <div className="mt-4 text-center text-sm">
          {t('auth.alreadyAccount')}{" "}
          <Link href="/auth/login" className="font-medium text-primary hover:underline">
            {t('auth.loginLink')}
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
