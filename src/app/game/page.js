"use client";

import dynamic from "next/dynamic";
import NavBar from "../components/Nav-Bar";

// The 3D world runs only in the browser (WebGL); keep it out of SSR and out
// of every other page's bundle.
const GameMode = dynamic(() => import("../components/game/GameMode"), {
  ssr: false,
  loading: () => (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-gradient-to-b from-zinc-950 to-black">
      <div className="w-12 h-12 rounded-full border-4 border-amber-500/30 border-t-amber-400 animate-spin" />
      <p className="text-amber-300 font-semibold tracking-wide">
        Entering the realm…
      </p>
    </div>
  ),
});

export default function GamePage() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <NavBar />
      <GameMode />
    </div>
  );
}
