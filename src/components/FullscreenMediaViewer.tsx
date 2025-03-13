import { useEffect } from "react";

type FullscreenMediaViewerProps = {
  media: { url: string; type: "image" | "video" } | null;
  onClose: () => void;
};

export default function FullscreenMediaViewer({ media, onClose }: FullscreenMediaViewerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!media) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50" onClick={onClose}>
      <div className="relative max-w-full max-h-full flex items-center justify-center">
        {/* 🔥 Display Image or Video */}
        {media.type === "image" ? (
          <img src={media.url} alt="Fullscreen Media" className="max-w-full max-h-screen rounded-lg" />
        ) : (
          <video controls autoPlay className="max-w-full max-h-screen rounded-lg">
            <source src={media.url} type="video/mp4" />
          </video>
        )}
      </div>
    </div>
  );
}
