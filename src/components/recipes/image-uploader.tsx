"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Camera, Loader2, X } from "lucide-react";
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
        <div className="relative aspect-video overflow-hidden rounded-xl bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt="Rezeptbild" className="h-full w-full object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="absolute right-3 top-3"
            onClick={onRemove}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <label className="flex aspect-video cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted/30 transition-colors hover:bg-muted/50">
          <Camera className="mb-2 h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Hauptbild hochladen</span>
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
            <DialogTitle>Bild zuschneiden</DialogTitle>
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
