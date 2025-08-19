"use client"

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
  } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { LanguageToggle } from "@/components/language-toggle"
import { ThemeToggle } from "@/components/theme-toggle"


export default function PreferencesPage() {

    return (
        <div className="space-y-8">
            <div>
                <h1 className="font-headline text-3xl font-bold">Preferences</h1>
                <p className="text-muted-foreground">
                    Customize your experience.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Appearance</CardTitle>
                    <CardDescription>
                        Change the look and feel of the application.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <Label>Theme</Label>
                        <ThemeToggle />
                    </div>
                    <div className="flex items-center justify-between">
                        <Label>Language</Label>
                        <LanguageToggle />
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
