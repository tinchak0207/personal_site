import * as React from "react";
import { cn } from "@/lib/utils";

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[60px] w-full rounded-[1.7rem] border border-white/56 bg-white/38 px-4 py-3 text-foreground placeholder:text-muted-foreground shadow-[0_10px_28px_rgba(89,103,122,0.03),inset_0_1px_0_rgba(255,255,255,0.72)] backdrop-blur-[24px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});

Textarea.displayName = "Textarea";

export { Textarea };
