
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
    className?: string;
}

export function LoadingSpinner({ className }: LoadingSpinnerProps) {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <Loader2 className={cn("h-12 w-12 animate-spin text-primary", className)} />
        </div>
    );
}
