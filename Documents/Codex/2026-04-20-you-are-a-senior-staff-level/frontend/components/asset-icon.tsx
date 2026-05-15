"use client";

import { displayAssetLabel } from "@/lib/asset-catalog";
import { cn } from "@/lib/utils";

type AssetIconProps = {
  symbol: string;
  name?: string | null;
  imageUrl?: string | null;
  className?: string;
};

export function AssetIcon({ symbol, name, imageUrl, className }: AssetIconProps) {
  const label = name ?? displayAssetLabel(symbol);
  const initials = label
    .replace(/USDT|USD|PERP/gi, "")
    .trim()
    .slice(0, 2)
    .toUpperCase();

  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={label}
        className={cn("h-full w-full rounded-2xl object-cover", className)}
        loading="lazy"
      />
    );
  }

  return (
    <span className={cn("text-xs font-semibold text-white", className)}>
      {initials || symbol.slice(0, 2)}
    </span>
  );
}
