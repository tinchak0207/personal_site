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
import { Stopwatch } from "./Stopwatch";
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
  const resolvedImageSrc = imageUrl || (image ? `data:image/png;base64,${image}` : null);

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
          "group relative aspect-square w-full overflow-hidden rounded-ios-3xl bg-[rgba(255,255,255,0.52)] shadow-[0_8px_32px_rgba(0,0,0,0.06)] backdrop-blur-[40px]",
          hasImage ? "cursor-zoom-in" : "",
        )}
        onClick={handleImageClick}
      >
        {/* fix #15: specular top edge */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-px bg-gradient-to-r from-transparent via-white to-transparent opacity-90" aria-hidden="true" />

        <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-end gap-3 p-4">

          {/* fix #16: unified iOS tint badges */}
          <div
            className={cn(
              "rounded-full px-3 py-1.5 text-ios-caption1 font-semibold whitespace-nowrap",
              failed
                ? "lg-tint-red text-[#FF3B30]"
                : hasImage
                  ? "bg-[rgba(0,0,0,0.52)] text-white"
                  : isRendering
                    ? "lg-tint-green text-[#34C759]"
                    : "lg-float text-[rgba(0,0,0,0.44)]",
            )}
          >
            {failed
              ? "需要重試"
              : timing?.elapsed
                ? `${(timing.elapsed / 1000).toFixed(1)}s`
                : isRendering
                  ? "生成中"
                  : "目前可用"}
          </div>
        </div>

        {hasImage && image ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedImageSrc ?? undefined}
              alt={`${provider} 生成的圖片`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.018]"
            />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.16)_0%,transparent_28%,transparent_72%,rgba(45,49,66,0.12)_100%)]" />

            <Button
              size="icon"
              variant="outline"
              className="absolute bottom-4 left-4 h-11 w-11 rounded-full border-white/52 bg-white/64 shadow-[0_14px_30px_rgba(45,49,66,0.08)] transition-all duration-200 sm:translate-y-1 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
              onClick={(event) => image ? handleActionClick(event, image, provider) : event.stopPropagation()}
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
              {/* fix #9 & #10: larger icon, stronger empty state */}
              <div className="lg-float flex h-20 w-20 items-center justify-center rounded-ios-2xl text-[rgba(0,0,0,0.36)]">
                {failed ? (
                  fallbackIcon || <AlertCircle className="h-9 w-9" />
                ) : isRendering ? (
                  <LoaderCircle className="h-9 w-9 animate-spin text-[#34C759]" />
                ) : (
                  <ImageIcon className="h-9 w-9" />
                )}
              </div>

              <h4 className="mt-5 text-ios-title3 font-semibold tracking-tight text-[rgba(0,0,0,0.72)]">
                {failed
                  ? "這次沒有成功"
                  : isRendering
                    ? "正在做圖"
                    : "圖片會出現在這裡"}
              </h4>

              <p className="mt-2 text-ios-subhead leading-relaxed text-[rgba(0,0,0,0.40)]">
                {failed
                  ? "換個說法再試一次，通常很快就會好。"
                  : isRendering
                    ? "先不用等在這裡，完成後會直接顯示。"
                    : "送出需求後，右側就會開始生成第一版圖片。"}
              </p>

              {isRendering && timing?.startTime ? (
                <div className="lg-float mt-4 rounded-full px-4 py-2">
                  <Stopwatch startTime={timing.startTime} />
                </div>
              ) : null}
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
                按 Esc 關閉
              </div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={resolvedImageSrc}
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
