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
  timing,
  failed,
  modelId,
}: ModelSelectProps) {
  const Icon = PROVIDER_ICONS[providerKey];
  const isRendering = Boolean(timing?.startTime) && !timing?.elapsed && !failed;

  const status = failed
    ? {
        label: "需要重試",
        className: "bg-[#f1e4e0] text-[#8a615a]",
        icon: <AlertTriangle className="h-4 w-4" />,
      }
    : isRendering
      ? {
          label: "生成中",
          className: "bg-[#e7efe9] text-[#59725e]",
          icon: <LoaderCircle className="h-4 w-4 animate-spin" />,
        }
      : timing?.elapsed
        ? {
            label: `${(timing.elapsed / 1000).toFixed(1)}s`,
            className: "bg-[#edf2ee] text-[#55695c]",
            icon: <CheckCircle2 className="h-4 w-4" />,
          }
        : {
            label: "待命",
            className: "bg-white/70 text-[#6f7987]",
            icon: <CheckCircle2 className="h-4 w-4 opacity-60" />,
          };

  return (
    <section
      className={cn(
        "paper-card relative overflow-hidden rounded-[2.15rem] p-4 sm:p-5",
        enabled ? "" : "opacity-50",
      )}
    >
      <div className="relative space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-3">
            <div className="paper-float flex h-12 w-12 items-center justify-center rounded-[1.3rem] text-foreground">
              <Icon size={22} />
            </div>
            <p className="text-sm font-medium text-foreground">{label}</p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select
              defaultValue={value}
              value={value}
              onValueChange={(selectedValue) =>
                onChange(selectedValue, providerKey)
              }
            >
              <SelectTrigger className="min-w-[220px] rounded-[1.35rem] border border-white/52 bg-white/58 px-4 py-3 text-left shadow-none">
                <SelectValue placeholder={value || "選擇版本"} />
              </SelectTrigger>
              <SelectContent className="rounded-[1.4rem]">
                <SelectGroup>
                  {models.map((model) => (
                    <SelectItem
                      key={model}
                      value={model}
                      className="rounded-[1rem]"
                    >
                      {model}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>

            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium",
                status.className,
              )}
            >
              {status.icon}
              {status.label}
            </div>
          </div>
        </div>

        <ImageDisplay
          modelId={modelId}
          provider={providerKey}
          image={image}
          timing={timing}
          failed={failed}
        />
      </div>
    </section>
  );
}
