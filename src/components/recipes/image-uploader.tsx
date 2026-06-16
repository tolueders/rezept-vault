"use client";

import { useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCropDialog } from "@/components/recipes/image-crop-dialog";
import { compressImage } from "@/lib/image-utils";

interface ImageUploaderProps {
  preview: string | null;
  onImageReady: (file: File, preview: string) => void;
  onRemove: () => void;
}

export function ImageUploader({ preview, onImageReady, onRemove }: ImageUploaderProps) {
  const [cropOpen, setCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    const url = URL.createObjectURL(compressed);
    setImageSrc(url);
    setCropOpen(true);
    e.target.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    const file = new File([blob], "recipe.webp", { type: "image/webp" });
    const previewUrl = URL.createObjectURL(blob);
    onImageReady(file, previewUrl);
    setCropOpen(false);
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
  }

  return (
    <div>
      {preview ? (
        <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:aspect-video">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Rezeptbild" className="h-full w-full object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-3 top-3 shadow-sm"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="image-upload-tile group flex aspect-[4/3] cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-border/60 bg-secondary/25 px-6 py-8 transition-colors hover:border-primary/30 hover:bg-secondary/40 sm:aspect-video">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 transition-transform group-hover:scale-105">
            <ImagePlus className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <span className="block text-sm font-medium text-foreground">
              Hauptbild hinzufügen
            </span>
            <span className="mt-1 block text-xs text-muted-foreground">
              Tippe zum Auswählen · optional
            </span>
          </div>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </label>
      )}

      <ImageCropDialog
        open={cropOpen}
        onOpenChange={(open) => {
          setCropOpen(open);
          if (!open && imageSrc) {
            URL.revokeObjectURL(imageSrc);
            setImageSrc(null);
          }
        }}
        imageSrc={imageSrc}
        aspect={16 / 9}
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}
