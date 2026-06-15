import imageCompression from "browser-image-compression";

const DEFAULT_OPTIONS = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: "image/webp" as const,
};

export async function compressImage(file: File): Promise<File> {
  try {
    const compressed = await imageCompression(file, DEFAULT_OPTIONS);
    return new File([compressed], file.name.replace(/\.[^.]+$/, ".webp"), {
      type: "image/webp",
    });
  } catch {
    return file;
  }
}

export function getCroppedImage(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number }
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = "anonymous";
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = pixelCrop.width;
      canvas.height = pixelCrop.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Canvas nicht verfügbar"));
        return;
      }
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      );
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error("Blob fehlgeschlagen"))),
        "image/webp",
        0.9
      );
    };
    image.onerror = reject;
    image.src = imageSrc;
  });
}
