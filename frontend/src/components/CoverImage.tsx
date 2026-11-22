"use client";

import { useState } from "react";
import { resolveMediaUrl } from "@/lib/media";

type Props = {
  url?: string;
  height?: string; // optional custom height class
};

export default function CoverImage({ url, height = "h-36" }: Props) {
  const cover = resolveMediaUrl(url);
  const isUsableCover = Boolean(cover);
  const [failedUrl, setFailedUrl] = useState<string | null>(null);

  return (
    <div className={`w-full ${height} relative overflow-hidden`}>
      {isUsableCover && failedUrl !== cover ? (
        <img
          src={cover}
          alt="Cover"
          className="w-full h-full object-cover"
          onError={() => setFailedUrl(cover)}
        />
      ) : (
        <div className="w-full h-full theme-gradient-brand" />
      )}
    </div>
  );
}
