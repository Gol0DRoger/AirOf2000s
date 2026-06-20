"use client";

import dynamic from "next/dynamic";

const SnakeGame = dynamic(() => import("@/components/SnakeGame"), {
  ssr: false,
});

export default function SnakeGameClient() {
  return <SnakeGame />;
}
