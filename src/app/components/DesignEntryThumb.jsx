import Image from "next/image";
import { cn } from "../../lib/utils";

export default function DesignEntryThumb({
  src,
  alt,
  className,
  imageClassName,
  priority = false,
}) {
  return (
    <div
      className={cn(
        "relative w-full bg-zinc-900 flex items-center justify-center overflow-hidden border border-zinc-800",
        className
      )}
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority={priority}
        sizes="(max-width: 768px) 100vw, 50vw"
        className={cn("object-contain p-3 md:p-4", imageClassName)}
      />
    </div>
  );
}
