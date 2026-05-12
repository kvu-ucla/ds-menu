import type { CSSProperties } from "react";
import type { CssSize, IconMode } from "../types";
import { ICON_NAMES, iconSrc } from "../lib/icons";

function toCssSize(value: CssSize | undefined): string | undefined {
  if (value === undefined || value === null || value === "") return undefined;
  if (typeof value === "number") return `${value}px`;

  const trimmed = value.trim();
  if (/^\d+(\.\d+)?$/.test(trimmed)) return `${trimmed}px`;
  return trimmed;
}

interface IconLegendProps {
  color?: string;
  mode?: IconMode;
  font?: CSSProperties["fontFamily"];
  fontSize?: CssSize;
  gap?: CssSize;
  gapItems?: CssSize;
  rowGap?: CssSize;
  imgSize?: CssSize;
  className?: string;
}

export default function IconLegend({
  color = "white",
  mode = "light",
  font = "var(--hall-font-bold)",
  fontSize = "16px",
  gap = "6px",
  gapItems = "16px",
  rowGap = "10px",
  imgSize = "25px",
  className = "",
}: IconLegendProps) {
  const finalFontSize = toCssSize(fontSize);
  const finalGap = toCssSize(gap);
  const finalGapItems = toCssSize(gapItems);
  const finalRowGap = toCssSize(rowGap);
  const finalImgSize = toCssSize(imgSize);

  return (
    <div
      className={`flex flex-wrap items-center justify-center ${className}`}
      style={{
        columnGap: finalGapItems,
        rowGap: finalRowGap,
        fontFamily: font,
      }}
    >
      {Object.entries(ICON_NAMES).map(([tag, name]) => {
        const src = iconSrc(tag, mode);

        return (
          <div
            key={tag}
            className="inline-flex items-center justify-center whitespace-nowrap"
            style={{
              gap: finalGap,
              fontFamily: font,
            }}
          >
            {src && (
              <img
                src={src}
                alt={name}
                title={name}
                className="relative -top-[1px] block object-contain"
                style={{
                  width: finalImgSize,
                  height: finalImgSize,
                }}
              />
            )}

            <span
              className="m-0 inline-flex items-center p-0 leading-none"
              style={{
                color,
                fontSize: finalFontSize,
                fontFamily: font,
              }}
            >
              {name}
            </span>
          </div>
        );
      })}
    </div>
  );
}
