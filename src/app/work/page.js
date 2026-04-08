"use client";

import NavBar from "../components/Nav-Bar";
import Image from "next/image";
import Link from "next/link";
import { CardContainer, CardBody, CardItem } from "../components/ui/3d-card";

export default function Work() {
  const projects = [
    {
      id: "tandem",
      title: "Tandem",
      description:
        "Full-stack web being built in production-ready, AI-assisted platforms with Next.js, TypeScript, PostgreSQL, and serverless cloud deployments.",
      image: "/tandem.svg",
      technologies: [
        "Next.js",
        "React",
        "TypeScript",
        "Tailwind CSS",
        "Socket.io",
        "PostgreSQL",
        "IBM Watson",
        "Grok AI",
        "Clerk",
        "Vercel",
      ],
      githubUrl: "https://github.com/IDSP-TRADECARE/Tandem",
      liveUrl:
        "https://www.tandem-app.com/sign-in?redirect_url=https%3A%2F%2Fwww.tandem-app.com%2F",
    },
    {
      id: "expense-tracker",
      title: "Expenses Tracker",
      description:
        "Built a full-stack expense tracking web app with secure authentication, type-safe data handling, and a scalable modern architecture using TypeScript and PostgreSQL.",
      image: "/expense-tracker.jpg",
      technologies: [
        "Vite",
        "React",
        "TypeScript",
        "Hono",
        "Bun",
        "Drizzle ORM",
        "PostgreSQL",
        "Tailwind CSS",
        "Kinde Auth",
        "Zod",
        "Render",
      ],
      githubUrl: "https://github.com/Lam-Thai/Expenses-App",
      liveUrl: "https://expenses-app-3ebn.onrender.com/",
    },
    {
      id: "insurflow",
      title: "InsurFlow - Vero Ventures",
      description:
        "Developed a comprehensive insurance management system with Next.js, TypeScript, and PostgreSQL, featuring user authentication, policy management, claims processing, and real-time notifications.",
      image: "/insurflow-logo.png",
      technologies: [
        "Next.js",
        "React",
        "TypeScript",
        "Tailwind CSS",
        "shadcn/ui",
        "Drizzle ORM",
        "PostgreSQL",
        "Better Auth",
        "Sonner",
        "Axiom",
        "Stripe",
        "UploadThing",
        "OpenAI",
        "Gemini",
        "Bun.js",
        "GitHub Actions",
        "Cloudflare Workers",
        "Recharts",
        "Neon",
        "Zod",
        "GitHub OAuth",
        "OpenTelemetry",
        "Vitest",
        "Playwright",
        "React Testing Library",
        "OpenNext",
        "Wrangler",
        "Docker",
        "Terraform",
        "ESLint",
        "Prettier",
        "Commitlint",
        "Husky",
        "TurboRepo",
        "Trivy",
        "lint-staged",
        "CodeQL",
        "Knip",
        "DependaBot",
        "SonarCloud",
        "GitGuardian",
        "Socket.dev",
        "Vercel",
      ],
      githubUrl: "https://github.com/Vero-Ventures",
      liveUrl: "https://insurflow.biz/",
    },
    {
      id: "bookstore",
      title: "Bookstore",
      description:
        "A beginner-friendly full-stack web app where users can browse books, view details, manage a shopping cart, and place orders while learning modern C# and .NET development.",
      image: "/bookstore.jpg",
      technologies: [
        "C#",
        ".NET 10",
        "Blazor Server",
        "ASP.NET Core",
        "Entity Framework Core",
        "SQLite",
        "SQL Server",
        "Render",
      ],
      githubUrl: "https://github.com/Lam-Thai/bookstore",
      liveUrl: "https://bookstore-2xqk.onrender.com/",
    },
    {
      id: "bandit-breakout",
      title: "Bandit Breakout",
      description:
        "A turn-based cartoon animal web game with a cowboy vibe, featuring dice-based board movement, dynamic events, and player-vs-player or boss battles, built with TypeScript, JavaScript, Phaser, MongoDB, Mongoose, and Socket.io.",
      image: "/bandit-breakout.svg",
      technologies: [
        "TypeScript",
        "JavaScript",
        "Node.js",
        "Phaser",
        "MongoDB",
        "Socket.io",
      ],
      githubUrl: "https://github.com/BB-CommandZ/BanditBreakout",
      liveUrl: "http://commandz.gochatus.org:30006/",
    },
    {
      id: "subsave",
      title: "SubSave",
      description:
        "A modern subscription finance app that helps users track recurring costs, avoid hidden renewals, and make better keep-or-cancel decisions with analytics and in-app AI guidance.",
      image: "/subsave.jpg",
      technologies: [
        "Next.js 14",
        "React 18",
        "TypeScript",
        "Tailwind CSS",
        "Recharts",
        "Prisma",
        "PostgreSQL",
        "Clerk",
        "Zod",
        "Gemini",
      ],
      githubUrl: "https://github.com/Lam-Thai/SubSave",
      liveUrl: "https://sub-save-gules.vercel.app/",
    },
  ];

  const MAX_VISIBLE_TECH = 6; // Maximum number of technologies to show

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <NavBar />

      <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            My{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Work
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            A collection of projects I&apos;ve built using modern web
            technologies
          </p>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {projects.map((project, index) => (
            <CardContainer key={index} containerClassName="py-8">
              <CardBody className="bg-zinc-900/50 relative group/card border border-zinc-800 w-full h-full rounded-xl p-6 hover:border-orange-500/50 transition-all flex flex-col min-h-[500px]">
                <Link
                  href={`/work/${project.id}`}
                  className="flex-grow flex flex-col"
                >
                  {/* Project Image */}
                  <CardItem
                    translateZ="50"
                    className="w-full mb-4 overflow-hidden rounded-lg cursor-pointer"
                  >
                    <div className="relative w-full h-48 bg-zinc-800 flex items-center justify-center">
                      <Image
                        src={project.image}
                        alt={project.title}
                        fill
                        className={`${project.id === "insurflow" || project.id === "tandem" ? "object-contain p-8" : "object-cover"} group-hover/card:scale-110 transition-transform duration-300`}
                      />
                    </div>
                  </CardItem>

                  {/* Project Title */}
                  <CardItem
                    translateZ="60"
                    className="text-xl font-bold text-white mb-2 cursor-pointer hover:text-orange-400 transition-colors line-clamp-2"
                  >
                    {project.title}
                  </CardItem>

                  {/* Project Description */}
                  <CardItem
                    as="p"
                    translateZ="40"
                    className="text-zinc-400 text-sm mb-4 line-clamp-3 flex-grow"
                  >
                    {project.description}
                  </CardItem>
                </Link>

                {/* Technologies */}
                <CardItem translateZ="30" className="mb-4">
                  <div className="flex flex-wrap gap-2">
                    {project.technologies
                      .slice(0, MAX_VISIBLE_TECH)
                      .map((tech, techIndex) => (
                        <span
                          key={techIndex}
                          className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-orange-400 text-xs font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    {project.technologies.length > MAX_VISIBLE_TECH && (
                      <span className="px-2 py-1 bg-orange-500/10 border border-orange-500/20 rounded text-orange-400 text-xs font-medium">
                        +{project.technologies.length - MAX_VISIBLE_TECH} more
                      </span>
                    )}
                  </div>
                </CardItem>

                {/* Action Buttons */}
                <div className="flex gap-3 mt-auto">
                  <CardItem
                    translateZ="60"
                    as="a"
                    href={project.githubUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg text-sm font-medium hover:bg-zinc-700 hover:border-orange-500/50 transition-all text-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-center gap-2">
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          fillRule="evenodd"
                          d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Code
                    </div>
                  </CardItem>

                  <CardItem
                    translateZ="60"
                    as="a"
                    href={project.liveUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg text-sm font-medium hover:from-orange-600 hover:to-amber-600 transition-all text-center"
                    onClick={(e) => e.stopPropagation()}
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                      Live
                    </div>
                  </CardItem>
                </div>
              </CardBody>
            </CardContainer>
          ))}
        </div>

        {/* View More */}
        <div className="text-center mt-12">
          <a
            href="https://github.com/Lam-Thai"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-4 bg-zinc-900/50 border border-zinc-800 text-white rounded-lg font-medium hover:border-orange-500/50 transition-all hover:scale-105"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path
                fillRule="evenodd"
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                clipRule="evenodd"
              />
            </svg>
            View More Projects on GitHub
          </a>
        </div>
      </main>
    </div>
  );
}
