import { Toaster } from "@/components/ui/sonner";

export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-[100dvh] bg-background">
      {children}
      <Toaster position="top-center" richColors />
    </div>
  );
}
