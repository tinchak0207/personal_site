import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Download,
  ImageIcon,
  LoaderCircle,
  Share,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Stopwatch } from "./Stopwatch";
import { ProviderTiming } from "@/lib/image-types";
import { imageHelpers } from "@/lib/image-helpers";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

interface ImageDisplayProps {
  provider: string;
  image: string | null | undefined;
  timing?: ProviderTiming;
  failed?: boolean;
  fallbackIcon?: React.ReactNode;
  enabled?: boolean;
  modelId: string;
}

export function ImageDisplay({
  provider,
  image,
  timing,
  failed,
  fallbackIcon,
  modelId,
}: ImageDisplayProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const hasImage = Boolean(image) && !failed;
  const isRendering = Boolean(timing?.startTime) && !timing?.elapsed && !failed;

  useEffect(() => {
    if (isZoomed) {
      window.history.pushState({ zoomed: true }, "");
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isZoomed) {
        setIsZoomed(false);
      }
    };

    const handlePopState = () => {
      if (isZoomed) {
        setIsZoomed(false);
      }
    };

    if (isZoomed) {
      document.addEventListener("keydown", handleEscape);
      window.addEventListener("popstate", handlePopState);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("popstate", handlePopState);
    };
  }, [isZoomed]);

  const handleImageClick = (event: React.MouseEvent) => {
    if (hasImage) {
      event.stopPropagation();
      setIsZoomed(true);
    }
  };

  const handleActionClick = (
    event: React.MouseEvent,
    imageData: string,
    providerName: string,
  ) => {
    event.stopPropagation();
    imageHelpers.shareOrDownload(imageData, providerName).catch((error) => {
      console.error("Failed to share/download image:", error);
    });
  };

  return (
    <>
      <div
        className={cn(
          "group relative aspect-square w-full overflow-hidden rounded-[2rem] border border-white/45 bg-[linear-gradient(180deg,rgba(255,255,255,0.58)_0%,rgba(247,249,251,0.42)_100%)] shadow-[0_10px_28px_rgba(89,103,122,0.03),inset_0_1px_0_rgba(255,255,255,0.62)] backdrop-blur-[18px]",
          hasImage ? "cursor-zoom-in" : "",
        )}
        onClick={handleImageClick}
      >
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-3 p-4">
          <div className="max-w-[72%] rounded-full paper-float px-3 py-1.5">
            <TooltipProvider>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Label className="block truncate text-xs font-medium text-foreground/88">
                    {imageHelpers.formatModelId(modelId)}
                  </Label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{modelId}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div
            className={cn(
              "rounded-full px-3 py-1.5 text-xs font-medium backdrop-blur-xl",
              failed
                ? "bg-[#f1e4e0] text-[#8a615a]"
                : hasImage
                  ? "bg-[#2d3142]/68 text-white/92"
                  : isRendering
                    ? "bg-[#e7efe9] text-[#59725e]"
                    : "bg-white/72 text-[#6f7987]",
            )}
          >
            {failed
              ? "需要重試"
              : timing?.elapsed
                ? `${(timing.elapsed / 1000).toFixed(1)}s`
                : isRendering
                  ? "生成中"
                  : "待命"}
          </div>
        </div>

        {hasImage && image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${image}`}
              alt={`${provider} 生成的圖片`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.018]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,transparent_28%,transparent_72%,rgba(45,49,66,0.12)_100%)]" />

            <Button
              size="icon"
              variant="outline"
              className="absolute bottom-4 left-4 h-11 w-11 rounded-full border-white/52 bg-white/64 shadow-[0_14px_30px_rgba(45,49,66,0.08)] transition-all duration-200 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
              onClick={(event) => handleActionClick(event, image, provider)}
            >
              <span className="sm:hidden">
                <Share className="h-4 w-4" />
              </span>
              <span className="hidden sm:block">
                <Download className="h-4 w-4" />
              </span>
            </Button>

            <div className="absolute bottom-4 right-4 rounded-full bg-white/18 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-xl">
              點一下放大
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="flex max-w-[20rem] flex-col items-center text-center">
              <div className="paper-float flex h-16 w-16 items-center justify-center rounded-[1.5rem] text-[#7b8694]">
                {failed ? (
                  fallbackIcon || <AlertCircle className="h-8 w-8" />
                ) : isRendering ? (
                  <LoaderCircle className="h-8 w-8 animate-spin text-[#59725e]" />
                ) : (
                  <ImageIcon className="h-8 w-8" />
                )}
              </div>

              <h4 className="mt-5 text-lg font-medium tracking-[-0.03em] text-foreground">
                {failed
                  ? "這次沒有成功"
                  : isRendering
                    ? "正在做圖"
                    : "圖片會出現在這裡"}
              </h4>

              <p className="mt-2 text-sm leading-7 text-[#6e7886]">
                {failed
                  ? "換個說法再試一次，通常很快就會好。"
                  : isRendering
                    ? "先不用等在這裡，完成後會直接顯示。"
                    : "送出需求後，右側就會開始生成第一版圖片。"}
              </p>

              {isRendering && timing?.startTime ? (
                <div className="zen-panel mt-4 rounded-full px-4 py-2">
                  <Stopwatch startTime={timing.startTime} />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>

      {isZoomed &&
        image &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex min-h-[100dvh] w-screen cursor-pointer items-center justify-center bg-[#1f2230]/74 p-6 backdrop-blur-md"
            onClick={() => setIsZoomed(false)}
          >
            <div className="absolute inset-x-0 top-6 flex justify-center">
              <div className="paper-float rounded-full px-4 py-2 text-sm text-[#6f7987]">
                按 Esc 關閉
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`data:image/png;base64,${image}`}
              alt={`${provider} 生成的圖片`}
              className="max-h-[88dvh] max-w-[92vw] rounded-[1.7rem] object-contain shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
              onClick={(event) => event.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
