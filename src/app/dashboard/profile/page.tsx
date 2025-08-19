import { ProfileForm } from "@/components/profile/profile-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function ProfilePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-headline text-3xl font-bold">Profile</h1>
        <p className="text-muted-foreground">
          Manage your account settings and personal information.
        </p>
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <Card>
            <CardHeader>
                <CardTitle>Personal Information</CardTitle>
                <CardDescription>Update your name and email address.</CardDescription>
            </CardHeader>
            <CardContent>
                <ProfileForm />
            </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Manage Subscription</CardTitle>
            <CardDescription>
              You are currently on the <strong>Pro Plan</strong>.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>Your plan renews on December 1, 2024.</p>
          </CardContent>
          <CardFooter className="border-t pt-4">
            <Button style={{ backgroundColor: 'hsl(var(--accent))', color: 'hsl(var(--accent-foreground))' }}>Manage in Stripe</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
