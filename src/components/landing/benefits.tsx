import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Package, ShoppingCart, Bot } from "lucide-react";

const benefits = [
  {
    icon: <BarChart className="h-8 w-8 text-primary" />,
    title: "Insightful Dashboard",
    description: "Get a clear overview of your business performance with key metrics and analytics at a glance.",
  },
  {
    icon: <Package className="h-8 w-8 text-primary" />,
    title: "Product Management",
    description: "Easily add, edit, and organize your products. Keep your catalog up-to-date effortlessly.",
  },
  {
    icon: <ShoppingCart className="h-8 w-8 text-primary" />,
    title: "Order Tracking",
    description: "Manage incoming orders, update their statuses, and keep track of your sales pipeline.",
  },
  {
    icon: <Bot className="h-8 w-8 text-primary" />,
    title: "AI-Powered Descriptions",
    description: "Save time by automatically generating compelling product descriptions with our AI assistant.",
  },
];

export function Benefits() {
  return (
    <section className="bg-secondary py-12 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="font-headline text-3xl font-bold">
            Everything You Need to Succeed
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Our platform is designed to streamline your workflow and boost your productivity.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <Card key={benefit.title} className="flex flex-col items-center text-center">
              <CardHeader>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
                  {benefit.icon}
                </div>
                <CardTitle className="font-headline">{benefit.title}</CardTitle>
                <CardDescription>{benefit.description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
