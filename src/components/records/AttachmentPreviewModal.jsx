import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, ImageOff } from "lucide-react";

export default function AttachmentPreviewModal({ adjunto, onOpenChange }) {
  const [url, setUrl] = useState("");
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!adjunto?.url) {
      setUrl("");
      return;
    }
    let vivo = true;
    setUrl("");
    setCargando(true);
    base44.integrations.Core.CreateFileSignedUrl({ file_uri: adjunto.url })
      .then((res) => {
        if (vivo) setUrl(res?.signed_url || "");
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [adjunto]);

  return (
    <Dialog open={!!adjunto} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="truncate pr-6 text-base">Vista Previa</DialogTitle>
        </DialogHeader>
        <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-xl bg-muted">
          {cargando ? (
            <Loader2 className="h-6 w-6 animate-spin text-brand-teal-700" />
          ) : url ? (
            <img src={url} alt={adjunto?.nombre || "Adjunto"} className="max-h-[70vh] w-auto object-contain" />
          ) : (
            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
              <ImageOff className="h-6 w-6" />
              <p className="text-sm">No pudimos cargar la vista previa</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}