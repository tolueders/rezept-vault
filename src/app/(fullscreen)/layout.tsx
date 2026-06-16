import { Toaster } from "@/components/ui/sonner";

export default function FullscreenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="h-[100dvh] overflow-hidden bg-background">
      {children}
      <Toaster position="top-center" richColors />
    </div>
  );
}
