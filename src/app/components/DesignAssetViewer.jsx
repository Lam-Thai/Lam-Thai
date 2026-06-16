import Image from "next/image";
import {
  encodeAssetPath,
  isImageAsset,
  isPdfAsset,
} from "../../lib/design-entries";

export default function DesignAssetViewer({ path, label }) {
  const src = encodeAssetPath(path);

  if (isPdfAsset(path)) {
    return (
      <div className="w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900/50">
        <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between gap-4">
          <span className="text-sm font-medium text-zinc-200">{label}</span>
          <a
            href={src}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-orange-400 hover:text-orange-300 whitespace-nowrap"
          >
            Open in new tab
          </a>
        </div>
        <iframe
          src={`${src}#toolbar=0&navpanes=0&view=FitH`}
          title={label}
          className="w-full h-[70vh] min-h-[480px] bg-zinc-100"
        />
      </div>
    );
  }

  if (isImageAsset(path)) {
    return (
      <div className="w-full rounded-lg overflow-hidden border border-zinc-800 bg-zinc-900/50">
        <div className="px-4 py-3 border-b border-zinc-800">
          <span className="text-sm font-medium text-zinc-200">{label}</span>
        </div>
        <div className="relative w-full aspect-[4/3] bg-zinc-800">
          <Image
            src={src}
            alt={label}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 80vw"
          />
        </div>
      </div>
    );
  }

  return null;
}
