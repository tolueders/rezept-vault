"use client";

import { useRef, useState } from "react";
import { Camera, Loader2, Plus, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCropDialog } from "@/components/recipes/image-crop-dialog";
import { MAX_RECIPE_SCAN_PHOTOS } from "@/lib/constants";
import { compressImageForAnalysis } from "@/lib/image-utils";

interface ScanPhoto {
  id: string;
  file: File;
  previewUrl: string;
}

interface RecipePhotoScannerProps {
  analyzing: boolean;
  analyzed: boolean;
  onAnalyze: (files: File[]) => void;
  onReset: () => void;
}

function PhotoGrid({ photos }: { photos: ScanPhoto[] }) {
  if (photos.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {photos.map((photo, index) => (
        <div
          key={photo.id}
          className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo.previewUrl}
            alt={`Rezeptfoto ${index + 1}`}
            className="h-full w-full object-cover"
          />
        </div>
      ))}
    </div>
  );
}

export function RecipePhotoScanner({
  analyzing,
  analyzed,
  onAnalyze,
  onReset,
}: RecipePhotoScannerProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<ScanPhoto[]>([]);
  const [cropOpen, setCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);

  const canAddMore = photos.length < MAX_RECIPE_SCAN_PHOTOS;

  function removePhoto(id: string) {
    setPhotos((prev) => {
      const photo = prev.find((p) => p.id === id);
      if (photo) URL.revokeObjectURL(photo.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  }

  function clearPhotos() {
    photos.forEach((p) => URL.revokeObjectURL(p.previewUrl));
    setPhotos([]);
  }

  function handleReset() {
    clearPhotos();
    onReset();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= MAX_RECIPE_SCAN_PHOTOS) return;

    const compressed = await compressImageForAnalysis(file);
    const url = URL.createObjectURL(compressed);
    setImageSrc(url);
    setCropOpen(true);
    e.target.value = "";
  }

  async function handleCropConfirm(blob: Blob) {
    const file = new File([blob], `scan-${photos.length + 1}.webp`, {
      type: "image/webp",
    });
    const previewUrl = URL.createObjectURL(blob);
    setPhotos((prev) => [...prev, { id: crypto.randomUUID(), file, previewUrl }]);
    setCropOpen(false);
    if (imageSrc) URL.revokeObjectURL(imageSrc);
    setImageSrc(null);
  }

  if (analyzed && photos.length > 0) {
    return (
      <div className="space-y-4">
        <PhotoGrid photos={photos} />
        <p className="text-center text-sm text-muted-foreground">
          KI-Daten wurden übernommen. Prüfe das Formular unten.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          disabled={analyzing}
          onClick={handleReset}
        >
          Neu fotografieren
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {photos.length > 0 ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <div
              key={photo.id}
              className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photo.previewUrl}
                alt={`Rezeptfoto ${index + 1}`}
                className="h-full w-full object-cover"
              />
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-1 top-1 h-7 w-7 shadow-sm"
                disabled={analyzing}
                onClick={() => removePhoto(photo.id)}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center px-2 py-2 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
            <Camera className="h-7 w-7 text-primary" />
          </div>
          <h3 className="text-base font-semibold">Rezept fotografieren</h3>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Bis zu {MAX_RECIPE_SCAN_PHOTOS} Fotos — z. B. Titelseite, Zutaten und
            Zubereitung. Pro Foto kannst du den Ausschnitt frei wählen.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {photos.length === 0 ? (
          <Button
            type="button"
            className="w-full"
            disabled={analyzing}
            onClick={() => photoInputRef.current?.click()}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Erstes Foto aufnehmen
          </Button>
        ) : (
          <>
            {canAddMore && (
              <Button
                type="button"
                variant="outline"
                className="w-full"
                disabled={analyzing}
                onClick={() => photoInputRef.current?.click()}
              >
                <Plus className="mr-2 h-4 w-4" />
                Weiteres Foto ({photos.length}/{MAX_RECIPE_SCAN_PHOTOS})
              </Button>
            )}
            <Button
              type="button"
              className="w-full"
              disabled={analyzing}
              onClick={() => onAnalyze(photos.map((p) => p.file))}
            >
              {analyzing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird analysiert…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  {photos.length === 1
                    ? "Rezept analysieren"
                    : `${photos.length} Fotos analysieren`}
                </>
              )}
            </Button>
          </>
        )}
      </div>

      <input
        ref={photoInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={analyzing || !canAddMore}
        onChange={handleFileSelect}
      />

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
        flexible
        title="Rezeptbereich auswählen"
        onConfirm={handleCropConfirm}
      />
    </div>
  );
}
