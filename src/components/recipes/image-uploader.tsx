"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Camera, ImagePlus, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { compressImage, getCroppedImage } from "@/lib/image-utils";

interface ImageUploaderProps {
  preview: string | null;
  onImageReady: (file: File, preview: string) => void;
  onRemove: () => void;
}

export function ImageUploader({ preview, onImageReady, onRemove }: ImageUploaderProps) {
  const [cropOpen, setCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const compressed = await compressImage(file);
    const url = URL.createObjectURL(compressed);
    setImageSrc(url);
    setCropOpen(true);
    e.target.value = "";
  }

  async function handleCropSave() {
    if (!imageSrc || !croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImage(imageSrc, croppedArea);
      const file = new File([blob], "recipe.webp", { type: "image/webp" });
      const previewUrl = URL.createObjectURL(blob);
      onImageReady(file, previewUrl);
      setCropOpen(false);
    } finally {
      setProcessing(false);
    }
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

      <Dialog open={cropOpen} onOpenChange={setCropOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Camera className="h-4 w-4" />
              Bild zuschneiden
            </DialogTitle>
          </DialogHeader>
          <div className="relative h-64">
            {imageSrc && (
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={16 / 9}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            )}
          </div>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full"
          />
          <Button onClick={handleCropSave} disabled={processing}>
            {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Übernehmen
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
