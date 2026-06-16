import NavBar from "../components/Nav-Bar";
import Link from "next/link";
import Image from "next/image";
import { CardContainer, CardBody, CardItem } from "../components/ui/3d-card";

const entries = [
  {
    id: "fpt",
    title: "FPT University",
    subtitle: "Graphic Design Bachelor",
    date: "Oct 2021 — Dec 2023",
    details: ["Illustrations", "3D", "Photograph", "Portfolio"],
    thumb: "/design/3D/3D_FRONT.png",
    assets: [
      "/design/illustrations/postcards.pdf",
      "/design/3D/6_can_box_3d.jpg",
      "/design/photograph/PFD.pdf",
      "/design/portfolio/Tuoc Lam Thai's Portfolio_compressed.pdf",
    ],
  },
  {
    id: "hongik",
    title: "Hongik University",
    subtitle: "Exchange program",
    date: "Feb 2023 — Jun 2023",
    details: ["Typography", "Magazine"],
    thumb: "/design/3D/3D_LEFT.png",
    assets: ["/design/typography/Hawaii_edition_typography.pdf", "/design/magazine/research1.pdf"],
  },
];

export default function Design() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden">
      <NavBar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            My <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">Design</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-2xl mx-auto">
            A curated selection of academic and personal design work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {entries.map((entry) => (
            <Link key={entry.id} href={`/design/${entry.id}`} className="block">
              <CardContainer containerClassName="py-8">
                <CardBody className="bg-zinc-900/50 relative group/card border border-zinc-800 w-full h-full rounded-xl p-6 hover:border-orange-500/50 transition-all">
                  <CardItem translateZ="50" className="w-full mb-4 overflow-hidden rounded-lg">
                    {entry.thumb ? (
                      <div className="relative w-full h-48 bg-zinc-800 flex items-center justify-center overflow-hidden rounded-lg">
                        <Image src={entry.thumb} alt={entry.title} width={800} height={480} className="object-cover w-full h-full" />
                      </div>
                    ) : (
                      <div className="relative w-full h-48 bg-zinc-800 flex items-center justify-center rounded-lg">
                        <span className="text-zinc-400">No preview</span>
                      </div>
                    )}
                  </CardItem>

                  <CardItem translateZ="100" className="mt-2">
                    <h3 className="text-lg font-semibold text-white">{entry.title}</h3>
                    <div className="text-sm text-zinc-400">{entry.subtitle} — <span className="text-zinc-300">{entry.date}</span></div>

                    <div className="mt-4">
                      <ul className="flex flex-wrap gap-2">
                        {entry.details.map((d) => (
                          <li key={d} className="inline-block bg-zinc-800/60 text-zinc-200 text-sm px-3 py-1 rounded-md">
                            {d}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardItem>
                </CardBody>
              </CardContainer>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}
