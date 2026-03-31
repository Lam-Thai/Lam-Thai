import Image from "next/image";
import NavBar from "./components/Nav-Bar";
import { CardContainer, CardBody, CardItem } from "./components/ui/3d-card";
import Link from "next/link";
import AnimatedStatValue from "./components/AnimatedStatValue";
import { TypewriterEffect } from "./components/ui/typewriter-effect";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      {/* Header/Navigation */}
      <NavBar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 min-h-screen flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left Content */}
          <div className="flex-1 space-y-8">
            <div className="inline-block">
              <span className="px-4 py-2 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium backdrop-blur-sm">
                Available for work
              </span>
            </div>

            <div className="space-y-2">
              <TypewriterEffect
                className="text-left text-5xl md:text-7xl font-bold leading-tight"
                cursorClassName="bg-white h-8 md:h-12"
                words={[
                  { text: "Tuoc", className: "text-white" },
                  { text: "Lam", className: "text-white" },
                  { text: "Thai", className: "text-white" },
                ]}
              />
              <TypewriterEffect
                className="text-left text-5xl md:text-7xl font-bold leading-tight"
                cursorClassName="bg-amber-400 h-8 md:h-12"
                words={[
                  {
                    text: "Web",
                    className:
                      "bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent dark:text-transparent",
                  },
                  {
                    text: "Developer",
                    className:
                      "bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent dark:text-transparent",
                  },
                ]}
              />
            </div>

            <p className="text-xl text-zinc-400 max-w-xl leading-relaxed">
              I&apos;m a full-stack web developer who builds clean, scalable web
              applications from intuitive front-end experiences to robust
              back-end systems.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <a
                href="/contact"
                className="group relative px-8 py-4 bg-white text-black rounded-lg font-medium overflow-hidden transition-all hover:scale-105"
              >
                <span className="relative z-10">Get in touch</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </a>
              <Link
                href="/work"
                className="group relative px-8 py-4 border border-zinc-700 text-white rounded-lg font-medium overflow-hidden transition-all hover:scale-105"
              >
                <span className="relative z-10">View my work</span>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              </Link>
            </div>

            {/* Social Links */}
            <div className="flex gap-6 pt-4">
              <a
                href="https://github.com/Lam-Thai"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 transition-colors group"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    fillRule="evenodd"
                    d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">GitHub</span>
              </a>
              <a
                href="https://www.linkedin.com/in/tuoclamthai/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 transition-colors group"
              >
                <svg
                  className="w-5 h-5"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                </svg>
                <span className="text-sm font-medium">LinkedIn</span>
              </a>
              <a
                href="/resume.pdf"
                download
                className="flex items-center gap-2 text-zinc-400 hover:text-orange-400 transition-colors group"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <span className="text-sm font-medium">Download Resume</span>
              </a>
            </div>

            {/* Stats */}
            <div className="flex gap-12 pt-8 border-t border-zinc-800">
              <div>
                <div className="text-3xl font-bold text-white">
                  <AnimatedStatValue target={2} suffix="+" />
                </div>
                <div className="text-sm text-zinc-500">Years Experience</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  <AnimatedStatValue target={10} suffix="+" delay={150} />
                </div>
                <div className="text-sm text-zinc-500">Projects Completed</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">
                  <AnimatedStatValue target={96} suffix="%" delay={300} />
                </div>
                <div className="text-sm text-zinc-500">Client Satisfaction</div>
              </div>
            </div>
          </div>

          {/* Right Content - Profile Image with 3D Effect */}
          <div className="relative flex-1 max-w-lg">
            <CardContainer containerClassName="py-0">
              <CardBody className="relative group/card w-auto h-auto">
                {/* Static gradient background behind card */}
                <div className="absolute -inset-8 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-3xl opacity-20 blur-2xl"></div>

                {/* Glowing border effect */}
                <CardItem
                  translateZ="50"
                  className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-2xl blur-xl opacity-75"
                />

                {/* Profile Image */}
                <CardItem
                  translateZ="100"
                  className="relative bg-zinc-900 rounded-2xl p-4 border border-zinc-800"
                >
                  <Image
                    src="/profile-pic.jpg"
                    alt="Profile"
                    width={500}
                    height={700}
                    className="rounded-xl w-full h-auto"
                    priority
                  />
                </CardItem>
              </CardBody>
            </CardContainer>
          </div>
        </div>

        {/* Tech Stack */}
        <div className="mt-20 pt-12 border-t border-zinc-800">
          <p className="text-sm text-zinc-500 mb-6 uppercase tracking-wider">
            Tech Stack
          </p>
          <div className="flex flex-wrap gap-6 items-center">
            {[
              "JavaScript",
              "TypeScript",
              "HTML/CSS",
              "React.js",
              "Next.js",
              "Node.js",
              "Express.js",
              "Bun.js",
              "Hono",
              "Vite",
              "Passport.js",
              "Prisma",
              "Drizzle",
              "MySQL",
              "PostgreSQL",
              "Neon",
              "C#",
              ".NET",
              "PHP",
              "Git",
              "Copilot",
              "Claude",
              "ChatGPT",
              "Cursor",
              "Grok",
              "WatsonX",
              "Gemini",
            ].map((tech) => (
              <div
                key={tech}
                className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-300 text-sm font-medium hover:border-zinc-700 transition-colors"
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
