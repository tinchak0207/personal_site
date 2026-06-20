"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useDropzone } from "react-dropzone";
import type { ReferenceImage } from "@/lib/image-types";
import { cn } from "@/lib/utils";

export const MAX_REFERENCE_IMAGES = 6;

interface ReferenceImageUploadProps {
  value: ReferenceImage[];
  onChange: (images: ReferenceImage[]) => void;
  compact?: boolean;
}

function createReferenceId(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}-${Math.random().toString(36).slice(2)}`;
}

export function ReferenceImageUpload({ value, onChange, compact }: ReferenceImageUploadProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const valueRef = useRef(value);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  const onDrop = useCallback(async (files: File[]) => {
    if (!files.length) return;
    setIsProcessing(true);
    try {
      const { default: imageCompression } = await import("browser-image-compression");
      const remainingSlots = Math.max(0, MAX_REFERENCE_IMAGES - valueRef.current.length);
      const selectedFiles = files.slice(0, remainingSlots);
      const processed = await Promise.all(
        selectedFiles.map(async (file) => {
          const compressed = await imageCompression(file, {
            maxSizeMB: 1.1,
            maxWidthOrHeight: 1600,
            useWebWorker: true,
          });
          const imageFile = compressed instanceof File
            ? compressed
            : new File([compressed], file.name, { type: file.type || "image/png" });
          return {
            id: createReferenceId(imageFile),
            name: file.name,
            file: imageFile,
            previewUrl: URL.createObjectURL(imageFile),
            size: imageFile.size,
          };
        }),
      );
      onChange([...valueRef.current, ...processed]);
    } finally {
      setIsProcessing(false);
    }
  }, [onChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    maxFiles: MAX_REFERENCE_IMAGES,
    disabled: isProcessing || value.length >= MAX_REFERENCE_IMAGES,
    onDrop,
  });

  const removeImage = (id: string) => {
    const target = value.find((image) => image.id === id);
    if (target) URL.revokeObjectURL(target.previewUrl);
    onChange(value.filter((image) => image.id !== id));
  };

  return (
    <div className={cn("space-y-3", compact && "space-y-2")}>
      <div
        {...getRootProps()}
        className={cn(
          "group flex cursor-pointer items-center gap-3 rounded-ios-2xl border border-dashed border-[rgba(0,0,0,0.10)] bg-[rgba(255,255,255,0.44)] px-4 py-3 text-left transition-all duration-200 backdrop-blur-[28px]",
          "hover:border-[rgba(0,122,255,0.28)] hover:bg-[rgba(0,122,255,0.06)]",
          isDragActive && "border-[rgba(0,122,255,0.46)] bg-[rgba(0,122,255,0.10)]",
          value.length >= MAX_REFERENCE_IMAGES && "cursor-default opacity-64",
        )}
      >
        <input {...getInputProps()} />
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-ios-xl bg-white/62 text-[rgba(0,122,255,0.82)] shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]">
          {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-ios-footnote font-semibold text-[rgba(0,0,0,0.72)]">
            {value.length ? `参考图 ${value.length}/${MAX_REFERENCE_IMAGES}` : "添加参考图"}
          </p>
          <p className="truncate text-ios-caption1 text-[rgba(0,0,0,0.38)]">
            支持多张图片，生成前会自动压缩。
          </p>
        </div>
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {value.map((image) => (
            <div key={image.id} className="group relative aspect-square overflow-hidden rounded-ios-xl bg-white/46 shadow-[0_8px_24px_rgba(45,49,66,0.06)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.previewUrl} alt={image.name} className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(image.id)}
                className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/52 text-white opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100"
                aria-label="移除参考图"
              >
                <X className="h-3.5 w-3.5" />
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/52 to-transparent p-1.5">
                <p className="truncate text-[10px] font-medium text-white/90">{image.name}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
