
import { cn } from "@/lib/utils";

type EmptyStateProps = {
    icon: React.ReactNode;
    title: string;
    description: string;
    action?: React.ReactNode;
    className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center text-center p-8 border-2 border-dashed rounded-lg bg-card", className)}>
        <div className="mb-4 text-primary">{icon}</div>
        <h3 className="text-xl font-semibold mb-2">{title}</h3>
        <p className="text-muted-foreground mb-4 max-w-sm">{description}</p>
        {action && <div>{action}</div>}
    </div>
  );
}
