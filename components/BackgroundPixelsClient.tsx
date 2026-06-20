"use client";

import dynamic from "next/dynamic";

const BackgroundPixels = dynamic(
  () => import("@/components/BackgroundPixels"),
  { ssr: false }
);

export default function BackgroundPixelsClient() {
  return <BackgroundPixels />;
}
