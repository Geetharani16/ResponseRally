import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { ProviderType } from "@/types";
import { ProviderBadge } from "../ProviderBadge";

interface SkeletonResponseProps {
    provider: ProviderType;
}

export const SkeletonResponse = ({ provider }: SkeletonResponseProps) => {
    return (
        <Card className="flex-shrink-0 w-[400px] h-full flex flex-col border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden animate-pulse">
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between">
                <ProviderBadge provider={provider} />
                <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-16 rounded-full" />
                </div>
            </div>

            {/* Body */}
            <div className="flex-1 p-4 space-y-3">
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-primary/50 rounded-full animate-bounce delay-150"></div>
                    <span className="text-sm text-muted-foreground ml-2">Thinking...</span>
                </div>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/5" />
            </div>

            {/* Footer Metrics Skeleton */}
            <div className="p-3 border-t border-border/50 bg-muted/20 grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex flex-col gap-1">
                    <Skeleton className="h-3 w-12" />
                    <Skeleton className="h-4 w-16" />
                </div>
            </div>
        </Card>
    );
};
