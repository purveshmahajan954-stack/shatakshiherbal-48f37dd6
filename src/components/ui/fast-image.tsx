import { useState } from "react";
import { cn } from "@/lib/utils";

interface FastImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
  aspectRatio?: "square" | "auto";
  wrapperClassName?: string;
}

export function FastImage({
  src,
  alt,
  priority = false,
  aspectRatio = "square",
  className,
  wrapperClassName,
  ...props
}: FastImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={cn(
        "relative overflow-hidden bg-accent/40",
        aspectRatio === "square" && "aspect-square",
        wrapperClassName
      )}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-accent/40 via-accent/70 to-accent/40 bg-[length:200%_100%]" />
      )}
      {!error ? (
        <img
          src={src}
          alt={alt}
          loading={priority ? "eager" : "lazy"}
          fetchPriority={priority ? "high" : "auto"}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "w-full h-full object-cover transition-opacity duration-200",
            loaded ? "opacity-100" : "opacity-0",
            className
          )}
          {...props}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-accent/30 text-muted-foreground text-xs">
          No image
        </div>
      )}
    </div>
  );
}
