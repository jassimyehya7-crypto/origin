import { useState, useEffect, useCallback } from "react";
import { X, ZoomIn, ZoomOut } from "lucide-react";
import { createPortal } from "react-dom";

interface ImageLightboxProps {
  src: string;
  alt: string;
  open: boolean;
  onClose: () => void;
}

export function ImageLightbox({ src, alt, open, onClose }: ImageLightboxProps) {
  const [scale, setScale] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) {
      setScale(1);
      return;
    }

    // Empêcher le scroll du body quand le lightbox est ouvert
    document.body.style.overflow = "hidden";

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  const zoomIn = useCallback(() => {
    setScale((s) => Math.min(s + 0.5, 4));
  }, []);

  const zoomOut = useCallback(() => {
    setScale((s) => Math.max(s - 0.5, 0.5));
  }, []);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={handleBackdropClick}
    >
      {/* Bouton fermer */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 grid size-11 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-colors hover:bg-white/20"
        aria-label="Fermer"
      >
        <X className="size-5" />
      </button>

      {/* Contrôles zoom */}
      <div className="absolute bottom-6 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-white/10 p-1 backdrop-blur-sm">
        <button
          onClick={zoomOut}
          className="grid size-10 place-items-center rounded-full text-white transition-colors hover:bg-white/20"
          aria-label="Zoom arrière"
        >
          <ZoomOut className="size-4.5" />
        </button>
        <span className="min-w-[3rem] text-center text-sm font-medium text-white tabular">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={zoomIn}
          className="grid size-10 place-items-center rounded-full text-white transition-colors hover:bg-white/20"
          aria-label="Zoom avant"
        >
          <ZoomIn className="size-4.5" />
        </button>
      </div>

      {/* Image */}
      <div
        className="flex max-h-[90vh] max-w-[95vw] items-center justify-center overflow-auto transition-transform duration-200"
        style={{ transform: `scale(${scale})` }}
      >
        <img
          src={src}
          alt={alt}
          className="max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl"
          draggable={false}
        />
      </div>
    </div>,
    document.body
  );
}

/**
 * Image cliquable qui ouvre un lightbox en plein écran
 */
export function ZoomableImage({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative cursor-zoom-in overflow-hidden ${className || ""}`}
        aria-label={`Agrandir: ${alt}`}
      >
        <img
          src={src}
          alt={alt}
          className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {/* Overlay hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors duration-300 group-hover:bg-black/20">
          <ZoomIn className="size-8 text-white opacity-0 drop-shadow-lg transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </button>
      <ImageLightbox src={src} alt={alt} open={open} onClose={() => setOpen(false)} />
    </>
  );
}
