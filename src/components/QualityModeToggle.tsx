"use client";

import { Zap, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export type QualityMode = "performance" | "quality";

interface QualityModeToggleProps {
  value: QualityMode;
  onValueChange: (value: QualityMode) => void;
  disabled?: boolean;
}

export function QualityModeToggle({
  onValueChange,
  disabled = false,
}: QualityModeToggleProps) {
  const { toast } = useToast();

  return (
    <div className="flex flex-col items-center gap-2 min-w-[240px]">
      <div className="flex gap-2">
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() => {
            onValueChange("performance");
            toast({
              description: "已切到快速出图，会更快看到第一版。",
              duration: 2000,
            });
          }}
        >
          <Zap className="h-4 w-4 mr-2" />
          快速出图
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() => {
            onValueChange("quality");
            toast({
              description: "已切到细节优先，会更注重画面完整度。",
              duration: 2000,
            });
          }}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          细节优先
        </Button>
      </div>
    </div>
  );
}
