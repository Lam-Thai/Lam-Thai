import NavBar from "../../components/Nav-Bar";
import Link from "next/link";
import Image from "next/image";

const entries = {
  fpt: {
    id: "fpt",
    title: "FPT University",
    subtitle: "Graphic Design Bachelor",
    date: "Oct 2021 — Dec 2023",
    details: ["Illustrations", "3D", "Photograph", "Portfolio"],
    thumb: "/design/3D/3D_FRONT.png",
    assets: [
      { href: "/design/illustrations/postcards.pdf", label: "Postcards (PDF)" },
      { href: "/design/3D/6_can_box_3d.jpg", label: "3D can box" },
      { href: "/design/photograph/PFD.pdf", label: "Photography (PDF)" },
      { href: "/design/portfolio/Tuoc Lam Thai's Portfolio_compressed.pdf", label: "Portfolio (PDF)" },
    ],
  },
  hongik: {
    id: "hongik",
    title: "Hongik University",
    subtitle: "Exchange program",
    date: "Feb 2023 — Jun 2023",
    details: ["Typography", "Magazine"],
    thumb: "/design/3D/3D_LEFT.png",
    assets: [
      { href: "/design/typography/Hawaii_edition_typography.pdf", label: "Hawaii typography (PDF)" },
      { href: "/design/magazine/research1.pdf", label: "Magazine research (PDF)" },
    ],
  },
};

export default function DesignEntry({ params }) {
  const { id } = params;
  const entry = entries[id];

  if (!entry) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <main className="max-w-4xl mx-auto px-6 py-32">
          <h1 className="text-2xl font-bold">Not Found</h1>
          <p className="mt-4 text-zinc-400">No design entry found for &quot;{id}&quot;.</p>
          <Link href="/design" className="mt-6 inline-block text-orange-400">Back to Design</Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white">
      <NavBar />

      <main className="max-w-5xl mx-auto px-6 py-20">
        <header className="mb-8">
          <h1 className="text-3xl font-bold">{entry.title}</h1>
          <div className="text-sm text-zinc-400">{entry.subtitle} — <span className="text-zinc-300">{entry.date}</span></div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
            {entry.thumb ? (
              <div className="relative w-full h-80 bg-zinc-800 rounded-lg overflow-hidden">
                <Image src={entry.thumb} alt={entry.title} fill className="object-cover" />
              </div>
            ) : (
              <div className="w-full h-80 bg-zinc-800 rounded-lg flex items-center justify-center">No preview</div>
            )}

            <div className="mt-6 text-zinc-300">
              <h3 className="text-lg font-semibold mb-2">About</h3>
              <p>
                {entry.id === "fpt"
                  ? "Coursework and projects include branding, editorial layouts, 3D asset creation, and curated photography."
                  : "Exchange semester focused on typography and magazine design, exploring layout systems, type-setting, and print workflows."}
              </p>

              <h4 className="mt-4 text-sm font-medium text-zinc-300">Details</h4>
              <ul className="flex flex-wrap gap-2 mt-2">
                {entry.details.map((d) => (
                  <li key={d} className="inline-block bg-zinc-800/60 text-zinc-200 text-sm px-3 py-1 rounded-md">{d}</li>
                ))}
              </ul>
            </div>
          </div>

          <aside className="bg-zinc-900/50 p-6 rounded-lg border border-zinc-800">
            <h4 className="text-sm text-zinc-300 font-medium">Assets</h4>
            <ul className="mt-3 space-y-2">
              {entry.assets.map((a) => (
                <li key={a.href}>
                  <a href={a.href} target="_blank" rel="noopener noreferrer" className="text-zinc-200 hover:text-orange-400 underline">{a.label}</a>
                </li>
              ))}
            </ul>

            <div className="mt-6">
              <Link href="/design" className="text-zinc-400 hover:text-orange-400">Back to Design</Link>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
