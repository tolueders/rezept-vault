"use client";

import { useCallback, useEffect, useState } from "react";
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
import { cn } from "@/lib/utils";

interface ImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string | null;
  title?: string;
  /** Festes Seitenverhältnis – nur wenn `flexible` false ist. */
  aspect?: number;
  /** Frei wählbares Seitenverhältnis per Schieberegler (für Rezept-Scan). */
  flexible?: boolean;
  onConfirm: (blob: Blob) => void | Promise<void>;
}

export function ImageCropDialog({
  open,
  onOpenChange,
  imageSrc,
  title = "Bild zuschneiden",
  aspect = 4 / 3,
  flexible = false,
  onConfirm,
}: ImageCropDialogProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [flexAspect, setFlexAspect] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  const [processing, setProcessing] = useState(false);

  const activeAspect = flexible ? flexAspect : aspect;

  useEffect(() => {
    if (!open) return;
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setFlexAspect(1);
    setCroppedArea(null);
  }, [open, imageSrc]);

  const onCropComplete = useCallback((_: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  }, []);

  async function handleConfirm() {
    if (!imageSrc || !croppedArea) return;
    setProcessing(true);
    try {
      const blob = await getCroppedImage(imageSrc, croppedArea);
      await onConfirm(blob);
    } finally {
      setProcessing(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "gap-4",
          flexible ? "max-w-2xl sm:max-w-2xl" : "max-w-lg gap-3 sm:max-w-lg"
        )}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-4 w-4" />
            {title}
          </DialogTitle>
          {flexible && (
            <p className="text-sm text-muted-foreground">
              Verschiebe und zoome das Bild. Passe das Seitenverhältnis des
              Ausschnitts nach Bedarf an.
            </p>
          )}
        </DialogHeader>
        <div
          className={cn(
            "relative overflow-hidden rounded-lg bg-muted",
            flexible ? "h-[min(55vh,420px)] min-h-[240px]" : "h-64"
          )}
        >
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={activeAspect}
              minZoom={flexible ? 0.4 : 1}
              maxZoom={flexible ? 5 : 3}
              showGrid={flexible}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={onCropComplete}
            />
          )}
        </div>

        <div className="space-y-3">
          <label className="block space-y-2">
            <span className="text-xs font-medium text-muted-foreground">
              Zoom
            </span>
            <input
              type="range"
              min={flexible ? 0.4 : 1}
              max={flexible ? 5 : 3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
            />
          </label>

          {flexible && (
            <label className="block space-y-2">
              <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
                <span>Seitenverhältnis</span>
                <span>{flexAspect.toFixed(2).replace(".", ",")} : 1</span>
              </div>
              <input
                type="range"
                min={0.35}
                max={2.2}
                step={0.05}
                value={flexAspect}
                onChange={(e) => setFlexAspect(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-[11px] text-muted-foreground">
                <span>Hochformat</span>
                <span>Quadrat</span>
                <span>Querformat</span>
              </div>
            </label>
          )}
        </div>

        <Button onClick={handleConfirm} disabled={processing || !croppedArea}>
          {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Ausschnitt übernehmen
        </Button>
      </DialogContent>
    </Dialog>
  );
}
