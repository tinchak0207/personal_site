import { AlertTriangle, CheckCircle2, LoaderCircle } from "lucide-react";
import { ImageDisplay } from "./ImageDisplay";
import { OpenAIIcon } from "@/lib/logos";
import { ProviderTiming } from "@/lib/image-types";
import { ProviderKey } from "@/lib/provider-config";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface ModelSelectProps {
  label: string;
  models: string[];
  value: string;
  providerKey: ProviderKey;
  onChange: (value: string, providerKey: ProviderKey) => void;
  iconPath: string;
  color: string;
  enabled?: boolean;
  onToggle?: (enabled: boolean) => void;
  image: string | null | undefined;
  imageUrl?: string | null | undefined;
  timing?: ProviderTiming;
  failed?: boolean;
  modelId: string;
}

const PROVIDER_ICONS = {
  image_tinchak: OpenAIIcon,
} as const;

export function ModelSelect({
  label,
  models,
  value,
  providerKey,
  onChange,
  enabled = true,
  image,
  imageUrl,
  timing,
  failed,
  modelId,
}: ModelSelectProps) {
  const Icon = PROVIDER_ICONS[providerKey];
  const isRendering = Boolean(timing?.startTime) && !timing?.elapsed && !failed;

  const status = failed
    ? {
        label: "需要重试",
        className: "lg-tint-red text-[#FF3B30]",
        icon: <AlertTriangle className="h-3.5 w-3.5" />,
      }
    : isRendering
      ? {
          label: "生成中",
          className: "lg-tint-green text-[#34C759]",
          icon: <LoaderCircle className="h-3.5 w-3.5 animate-spin" />,
        }
      : timing?.elapsed
        ? {
            label: `${(timing.elapsed / 1000).toFixed(1)}s`,
            className: "lg-tint-green text-[#34C759]",
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
          }
        : {
            label: "当前可用",
            className: "lg-float text-[rgba(0,0,0,0.44)]",
            icon: null,
          };

  return (
    <section
      className={cn(
        "lg-card relative overflow-hidden rounded-ios-3xl p-4 sm:p-5",
        !enabled && "opacity-50",
      )}
    >
      {/* Specular top edge */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px rounded-t-ios-3xl bg-gradient-to-r from-transparent via-white to-transparent opacity-80" aria-hidden="true" />

      <div className="relative space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Provider identity */}
          <div className="flex items-center gap-3">
            <div className="lg-float flex h-11 w-11 items-center justify-center rounded-ios-xl text-[rgba(0,0,0,0.72)]">
              <Icon size={20} />
            </div>
            <div className="flex items-center gap-2">
              <p className="text-ios-subhead font-semibold text-[rgba(0,0,0,0.85)]">{label}</p>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Select
              defaultValue={value}
              value={value}
              onValueChange={(v) => onChange(v, providerKey)}
            >
              <SelectTrigger className="min-w-[180px] rounded-ios-xl border-0 bg-[rgba(0,0,0,0.04)] px-4 py-2.5 text-ios-footnote font-medium text-[rgba(0,0,0,0.72)] shadow-none focus:ring-2 focus:ring-[rgba(0,122,255,0.20)]">
                <SelectValue placeholder={value || "选择模型"} />
              </SelectTrigger>
              <SelectContent className="rounded-ios-xl border-0 lg-sheet">
                <SelectGroup>
                  {models.map((model) => (
                    <SelectItem
                      key={model}
                      value={model}
                      className="rounded-ios-lg text-ios-footnote"
                    >
                      {model}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            {/* Status badge — only show when generating or done */}
            {(status.label !== "当前可用") && (
            <div
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-ios-footnote font-semibold",
                status.className,
              )}
            >
              {status.icon}
              {status.label}
            </div>
            )}
          </div>
        </div>

        <ImageDisplay
          modelId={modelId}
          provider={providerKey}
          image={image}
          imageUrl={imageUrl}
          timing={timing}
          failed={failed}
        />
      </div>
    </section>
  );
}
