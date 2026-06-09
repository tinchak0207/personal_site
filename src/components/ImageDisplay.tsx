import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Download,
  ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GenerationProgressBar } from "@/components/GenerationProgressBar";
import { ProviderTiming } from "@/lib/image-types";
import { imageHelpers } from "@/lib/image-helpers";
import { cn } from "@/lib/utils";

interface ImageDisplayProps {
  provider: string;
  image: string | null | undefined;
  imageUrl?: string | null | undefined;
  timing?: ProviderTiming;
  failed?: boolean;
  fallbackIcon?: React.ReactNode;
  enabled?: boolean;
  modelId: string;
}

export function ImageDisplay({
  provider,
  image,
  imageUrl,
  timing,
  failed,
  fallbackIcon,
  // modelId kept in interface for API compatibility
}: ImageDisplayProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const hasImage = (Boolean(image) || Boolean(imageUrl)) && !failed;
  const isRendering = Boolean(timing?.startTime) && !timing?.elapsed && !failed;
  const resolvedImageSrc = image ? `data:image/png;base64,${image}` : imageUrl || null;

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
    imageSource: string,
    providerName: string,
  ) => {
    event.stopPropagation();
    imageHelpers.download(imageSource, providerName).catch((error) => {
      console.error("Failed to download image:", error);
    });
  };

  return (
    <>
      <div
        className={cn(
          "group relative aspect-square w-full overflow-hidden rounded-ios-3xl bg-[rgba(255,255,255,0.52)] shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-[40px]",
          hasImage ? "cursor-zoom-in" : "",
        )}
        onClick={handleImageClick}
      >
        {/* fix #15: specular top edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" aria-hidden="true" />

        {!isRendering && (
        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-end gap-3 p-4">

          {/* fix #16: unified iOS tint badges */}
          <div
            className={cn(
              "rounded-full px-3 py-1.5 text-ios-caption1 font-semibold whitespace-nowrap",
              failed
                ? "lg-tint-red text-[#FF3B30]"
                : hasImage
                  ? "bg-[rgba(0,0,0,0.52)] text-white"
                  : "lg-float text-[rgba(0,0,0,0.44)]",
            )}
          >
              {failed
                ? "需要重试"
                : hasImage
                  ? "已完成"
                  : "当前可用"}
          </div>
        </div>
        )}

        {hasImage && resolvedImageSrc ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedImageSrc ?? undefined}
              alt={`${provider} 生成的图片`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.018]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,transparent_28%,transparent_72%,rgba(45,49,66,0.12)_100%)]" />

            <Button
              size="icon"
              variant="outline"
              className="absolute bottom-4 left-4 h-11 w-11 rounded-full border-white/52 bg-white/64 shadow-[0_14px_30px_rgba(45,49,66,0.08)] transition-all duration-200 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
              onClick={(event) => handleActionClick(event, resolvedImageSrc, provider)}
              aria-label="下载图片"
            >
              <Download className="h-4 w-4" />
            </Button>

            <div className="absolute bottom-4 right-4 rounded-full bg-white/18 px-3 py-2 text-xs font-medium text-white/90 backdrop-blur-xl">
              点一下放大
            </div>
          </>
        ) : isRendering ? (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <GenerationProgressBar
              visible={isRendering}
              startedAt={timing?.startTime}
              durationMs={timing?.durationMs}
            />
          </div>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="flex max-w-[20rem] flex-col items-center text-center">
              {/* fix #9 & #10: larger icon, stronger empty state */}
              <div className="lg-float flex h-20 w-20 items-center justify-center rounded-ios-2xl text-[rgba(0,0,0,0.36)]">
                {failed ? (
                  fallbackIcon || <AlertCircle className="h-9 w-9" />
                ) : (
                  <ImageIcon className="h-9 w-9" />
                )}
              </div>

              <h4 className="mt-5 text-ios-title3 font-semibold tracking-tight text-[rgba(0,0,0,0.72)]">
                {failed
                  ? "这次没有成功"
                  : "图片会出现在这里"}
              </h4>

              <p className="mt-2 text-ios-subhead leading-relaxed text-[rgba(0,0,0,0.40)]">
                {failed
                  ? "换个说法再试一次，通常很快就会恢复。"
                  : "提交需求后，右侧会开始生成第一版图片。"}
              </p>
            </div>
          </div>
        )}
      </div>

      {isZoomed &&
        resolvedImageSrc &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex min-h-[100dvh] w-screen cursor-pointer items-center justify-center bg-[#1f2230]/74 p-6 backdrop-blur-md"
            onClick={() => setIsZoomed(false)}
          >
            <div className="absolute inset-x-0 top-6 flex justify-center">
              <div className="paper-float rounded-full px-4 py-2 text-sm text-[#6f7987]">
                按 Esc 关闭
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedImageSrc}
              alt={`${provider} 生成的图片`}
              className="max-h-[88dvh] max-w-[92vw] rounded-[1.7rem] object-contain shadow-[0_30px_80px_rgba(0,0,0,0.22)]"
              onClick={(event) => event.stopPropagation()}
            />
          </div>,
          document.body,
        )}
    </>
  );
}
