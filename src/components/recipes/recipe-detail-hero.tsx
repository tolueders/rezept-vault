"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ImagePlus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ImageCropDialog } from "@/components/recipes/image-crop-dialog";
import { updateRecipeImage } from "@/lib/actions/recipes";
import { uploadRecipeImage } from "@/lib/actions/profile";
import { compressImage } from "@/lib/image-utils";
import { toast } from "sonner";

interface RecipeDetailHeroProps {
  recipeId: string;
  title: string;
  imageUrl: string | null;
  canUpload: boolean;
}

export function RecipeDetailHero({
  recipeId,
  title,
  imageUrl: initialImageUrl,
  canUpload,
}: RecipeDetailHeroProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [cropOpen, setCropOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file);
      setImageSrc(URL.createObjectURL(compressed));
      setCropOpen(true);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Bild konnte nicht geladen werden"
      );
    } finally {
      e.target.value = "";
    }
  }

  async function handleCropConfirm(blob: Blob) {
    setUploading(true);
    try {
      const file = new File([blob], "recipe.webp", { type: "image/webp" });
      const fd = new FormData();
      fd.append("file", file);
      const publicUrl = await uploadRecipeImage(fd);
      await updateRecipeImage(recipeId, publicUrl);
      setImageUrl(publicUrl);
      setCropOpen(false);
      if (imageSrc) URL.revokeObjectURL(imageSrc);
      setImageSrc(null);
      toast.success("Bild gespeichert");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload fehlgeschlagen");
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <div className="relative mb-6 aspect-[4/3] overflow-hidden rounded-xl bg-muted sm:mb-8 sm:aspect-[16/9] sm:rounded-2xl md:aspect-[21/9]">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={title}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        ) : canUpload ? (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <p className="text-sm text-muted-foreground">Kein Bild</p>
            <Button
              type="button"
              variant="secondary"
              className="rounded-xl shadow-sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Wird hochgeladen…
                </>
              ) : (
                <>
                  <ImagePlus className="mr-2 h-4 w-4" />
                  Bild hinzufügen
                </>
              )}
            </Button>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            Kein Bild
          </div>
        )}
      </div>

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
    </>
  );
}
