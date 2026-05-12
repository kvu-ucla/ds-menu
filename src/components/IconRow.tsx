import type { CssSize, IconMode } from "../types";
import { iconSrc, uniqueIconTags } from "../lib/icons";

interface IconRowProps {
  tags?: unknown[];
  mode?: IconMode;
  gap?: CssSize;
  size?: CssSize;
  className?: string;
}

function toCssSize(value: CssSize): string {
  if (typeof value === "number") return `${value}px`;
  const trimmed = value.trim();
  return /^\d+(\.\d+)?$/.test(trimmed) ? `${trimmed}px` : trimmed;
}

export default function IconRow({
  tags = [],
  mode = "light",
  gap = "6px",
  size = "25px",
  className = "",
}: IconRowProps) {
  const iconTags = uniqueIconTags(tags);
  if (!iconTags.length) return null;

  const finalGap = toCssSize(gap);
  const finalSize = toCssSize(size);

  return (
    <div className={`mt-2 flex items-center pb-4 ${className}`} style={{ gap: finalGap }}>
      {iconTags.map((tag) => {
        const src = iconSrc(tag, mode);
        if (!src) return null;

        return (
          <img
            key={tag}
            src={src}
            alt={tag}
            title={tag}
            className="relative -top-[1px] block object-contain"
            style={{ width: finalSize, height: finalSize }}
          />
        );
      })}
    </div>
  );
}
