"use client";

import { useCallback, useState } from "react";
import Cropper, { Area } from "react-easy-crop";
import { Camera, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getCroppedImage } from "@/lib/image-utils";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  title?: string;
  aspect?: number;
  onConfirm: (blob: Blob) => void | Promise<void>;
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  title = "Bild zuschneiden",
  aspect = 4 / 3,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  async function handleConfirm() {
    if (!imageSrc || !croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImage(imageSrc, croppedArea);
      await onConfirm(blob);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setCroppedArea(null);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg gap-3 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {title}
          </DialogTitle>
        </DialogHeader>
        <div className="relative h-64 overflow-hidden rounded-lg bg-muted">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
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
        <Button onClick={handleConfirm} disabled={processing || !croppedArea}>
          {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Übernehmen
        </Button>
      </DialogContent>
    </Dialog>
  );
}
