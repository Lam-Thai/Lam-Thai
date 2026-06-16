import NavBar from "../../components/Nav-Bar";
import Link from "next/link";
import Image from "next/image";
import DesignAssetViewer from "../../components/DesignAssetViewer";
import { getDesignEntry, getDesignEntryList } from "../../../lib/design-entries";

export function generateStaticParams() {
  return getDesignEntryList().map((entry) => ({ id: entry.id }));
}

export default async function DesignEntry({ params }) {
  const { id } = await params;
  const entry = getDesignEntry(id);

  if (!entry) {
    return (
      <div className="min-h-screen bg-black text-white">
        <NavBar />
        <main className="max-w-4xl mx-auto px-6 py-32">
          <h1 className="text-2xl font-bold">Not Found</h1>
          <p className="mt-4 text-zinc-400">
            No design entry found for &quot;{id}&quot;.
          </p>
          <Link href="/design" className="mt-6 inline-block text-orange-400">
            Back to Design
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black text-white overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

      <NavBar />

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20">
        <Link
          href="/design"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-400 transition-colors mb-8"
        >
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
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Design
        </Link>

        <header className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-3">{entry.title}</h1>
          <div className="text-zinc-400">
            {entry.subtitle} —{" "}
            <span className="text-zinc-300">{entry.date}</span>
          </div>
          <p className="mt-4 text-zinc-300 max-w-3xl">{entry.description}</p>
          <ul className="flex flex-wrap gap-2 mt-6">
            {entry.details.map((detail) => (
              <li
                key={detail}
                className="inline-block bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm px-3 py-1 rounded-md"
              >
                {detail}
              </li>
            ))}
          </ul>
        </header>

        <div className="relative w-full h-64 md:h-80 rounded-xl overflow-hidden border border-zinc-800 mb-16">
          <Image
            src={entry.thumb}
            alt={entry.title}
            fill
            className="object-cover"
            priority
          />
        </div>

        <div className="space-y-16">
          {entry.categories.map((category) => (
            <section key={category.id} id={category.id}>
              <h2 className="text-2xl font-bold mb-6 pb-3 border-b border-zinc-800">
                {category.label}
              </h2>
              <div className="space-y-8">
                {category.assets.map((asset) => (
                  <DesignAssetViewer
                    key={asset.path}
                    path={asset.path}
                    label={asset.label}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
