"use client";

import NavBar from "../components/Nav-Bar";
import { AnimatedTestimonials } from "../components/ui/animated-testimonials";

export default function About() {
  const educationAndExperience = [
    {
      name: "BCIT - Diploma in Full Stack Web Development",
      designation: "Sep 2024 - Apr 2026 | Vancouver, BC",
      src: "/bcit.png",
      quote:
        "Focused on full-stack web development, database management, and software engineering principles. Gained hands-on experience with modern frameworks and technologies including React, Node.js, and cloud services.",
    },
    {
      name: "FPT University - Bachelor of Graphic Design",
      designation: "Oct 2021 - Dec 2023 | Ho Chi Minh City, Vietnam",
      src: "/fpt-uni.jpg",
      quote:
        "Studied graphic design principles, visual communication, and multimedia production. Developed skills in Adobe Creative Suite, UI/UX design, and digital marketing strategies.",
    },
    {
      name: "Hongik University - Exchange Student in Visual Design",
      designation: "Feb 2023 - June 2023 | Seoul, South Korea",
      src: "/hongik-uni.jpg",
      quote:
        "Participated in an exchange program focusing on visual design and contemporary art. Engaged in collaborative projects that enhanced cross-cultural communication and design thinking skills.",
    },
    {
      name: "Vero Ventures - Full Stack Developer Intern",
      designation: "Jan 2026 - Apr 2026 | California, USA",
      src: "/vero-ventures.png",
      quote:
        "Contributed to the development of web applications using React and Bun.js. Assisted in database design and API integration, while collaborating with a team of developers to deliver high-quality software solutions.",
    },
  ];

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
            About{" "}
            <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-yellow-400 bg-clip-text text-transparent">
              Me
            </span>
          </h1>
          <p className="text-xl text-zinc-400 max-w-2xl mx-auto">
            My journey in web development and technology
          </p>
        </div>

        {/* Education & Experience Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white mb-8 flex items-center justify-center gap-3">
            <span className="w-2 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></span>
            Education & Experience
            <span className="w-2 h-8 bg-gradient-to-b from-orange-500 to-amber-500 rounded-full"></span>
          </h2>

          <AnimatedTestimonials
            testimonials={educationAndExperience}
            autoplay={false}
          />
        </div>

        {/* Tech Stack Section */}
        <div className="mt-20 pt-12 border-t border-zinc-800">
          <p className="text-sm text-zinc-500 mb-6 uppercase tracking-wider text-center">
            Tech Stack & Tools
          </p>
          <div className="flex flex-wrap gap-4 items-center justify-center">
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
                className="px-4 py-2 bg-zinc-900/50 border border-zinc-800 rounded-lg text-zinc-300 text-sm font-medium hover:border-orange-500/50 hover:scale-[1.2] transition-all duration-300"
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
