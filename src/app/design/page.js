import NavBar from "../components/Nav-Bar";

export default function Design() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden">
      <NavBar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            My <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">Design</span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            A curated selection of graphic and typographic work.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Example gallery items - update with real assets as needed */}
          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
            <div className="flex items-center justify-center w-full h-48 bg-zinc-800 rounded-lg overflow-hidden">
              <a
                href="/design/typography/Hawaii_edition_typography.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-zinc-400 underline"
              >
                Open typography PDF
              </a>
            </div>
            <div className="mt-3 text-white font-medium">Typography — Hawaii edition</div>
            <div className="text-sm text-zinc-400">Magazine typography exploration</div>
          </div>

          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
            <div className="relative w-full h-48 bg-zinc-800 rounded-lg overflow-hidden" />
            <div className="mt-3 text-white font-medium">Illustration</div>
            <div className="text-sm text-zinc-400">Editorial illustration and concept art</div>
          </div>

          <div className="bg-zinc-900/50 rounded-lg p-4 border border-zinc-800">
            <div className="relative w-full h-48 bg-zinc-800 rounded-lg overflow-hidden" />
            <div className="mt-3 text-white font-medium">Photography</div>
            <div className="text-sm text-zinc-400">Selected photographs and photo edits</div>
          </div>
        </div>
      </main>
    </div>
  );
}
