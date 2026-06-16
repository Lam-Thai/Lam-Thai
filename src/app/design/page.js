"use client";

import NavBar from "../components/Nav-Bar";
import Link from "next/link";
import DesignEntryThumb from "../components/DesignEntryThumb";
import { CardContainer, CardBody, CardItem } from "../components/ui/3d-card";
import { getDesignEntryList } from "../../lib/design-entries";

export default function Design() {
  const entries = getDesignEntryList();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <NavBar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            My{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Design
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            A curated selection of academic and personal design work
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {entries.map((entry) => (
            <CardContainer key={entry.id} containerClassName="py-8">
              <CardBody className="bg-zinc-900/50 relative group/card border border-zinc-800 w-full h-full rounded-xl p-6 hover:border-orange-500/50 transition-all flex flex-col min-h-[500px]">
                <Link
                  href={`/design/${entry.id}`}
                  className="flex-grow flex flex-col"
                >
                  <CardItem
                    translateZ="50"
                    className="w-full mb-4 overflow-hidden rounded-lg cursor-pointer"
                  >
                    <DesignEntryThumb
                      src={entry.thumb}
                      alt={entry.title}
                      className="h-52 rounded-lg"
                      imageClassName="group-hover/card:scale-105 transition-transform duration-300"
                    />
                  </CardItem>

                  <CardItem
                    translateZ="60"
                    className="text-xl font-bold text-white mb-2 cursor-pointer hover:text-orange-400 transition-colors line-clamp-2"
                  >
                    {entry.title}
                  </CardItem>

                  <CardItem
                    as="p"
                    translateZ="40"
                    className="text-zinc-400 text-sm mb-4 line-clamp-3 flex-grow"
                  >
                    {entry.description}
                  </CardItem>
                </Link>

                <CardItem translateZ="30" className="mb-4">
                  <div className="text-sm text-zinc-400 mb-3">
                    {entry.subtitle} —{" "}
                    <span className="text-zinc-300">{entry.date}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entry.details.map((detail) => (
                      <span
                        key={detail}
                        className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-orange-400 text-xs font-medium"
                      >
                        {detail}
                      </span>
                    ))}
                  </div>
                </CardItem>

                <div className="flex gap-3 mt-auto">
                  <CardItem
                    translateZ="60"
                    as={Link}
                    href={`/design/${entry.id}`}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-amber-600 transition-all text-center"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                        />
                      </svg>
                      View Work
                    </div>
                  </CardItem>
                </div>
              </CardBody>
            </CardContainer>
          ))}
        </div>
      </main>
    </div>
  );
}
