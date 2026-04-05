"use client";

import { useParams } from "next/navigation";
import NavBar from "../../components/Nav-Bar";
import Image from "next/image";
import Link from "next/link";

export default function ProjectDetail() {
  const params = useParams();
  const projectId = params.id;

  // Project data (same as in work page)
  const projects = {
    tandem: {
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
      blogUrl: "https://tandem-blog.vercel.app/",
      figmaDesignUrl:
        "https://www.figma.com/design/98OrmiJpKUOwDCuckMRcah/Tandem-High-fi?node-id=2533-3139&p=f&t=PjVaRx0ZO3AkqMhl-0",
      isCaseStudy: true,
      problemStatement:
        "Parents in the trades face a critical technical and operational challenge: their work schedules are unpredictable, often starting at 4-5 AM with constant changes throughout the day. Traditional childcare booking systems operate on fixed schedules and weekly planning cycles, creating a fundamental mismatch with trades workers' actual availability patterns. The problem requires a system capable of dynamic schedule ingestion, real-time matching algorithms, and flexible booking logic.",
      solutionOverview:
        "Tandem solves this through a multi-layered technical architecture: a flexible schedule input system that accepts documents, manual entries, and voice input (processed via AI); a temporal database model that handles shifting time windows; a real-time WebSocket layer for live availability updates; and an AI-powered matching engine that identifies compatible families and nannies despite schedule variability.",
      architecture: {
        title: "System Architecture",
        overview:
          "Tandem employs a modern full-stack architecture with clear separation of concerns: frontend UI layer, real-time communication layer, backend API layer, and data persistence layer.",
        components: [
          {
            name: "Frontend",
            description:
              "Next.js with React, TypeScript for type safety, Tailwind CSS for responsive design",
            responsibilities: [
              "Client-side schedule form handling",
              "Real-time calendar rendering and updates",
              "Voice input integration",
              "Document upload preview and parsing",
            ],
          },
          {
            name: "Real-time Layer",
            description: "Socket.io for bidirectional communication",
            responsibilities: [
              "Live schedule synchronization across users",
              "Instant booking notifications",
              "Chat coordination between families",
              "Server-sent availability updates",
            ],
          },
          {
            name: "Backend API",
            description: "Next.js API routes with TypeScript",
            responsibilities: [
              "Schedule parsing and temporal processing",
              "Matching algorithm execution",
              "Authentication & authorization via Clerk",
              "Business logic for nanny-family pairing",
            ],
          },
          {
            name: "Data Layer",
            description: "PostgreSQL with optimized schema",
            responsibilities: [
              "Time-series schedule storage",
              "User profiles and preferences",
              "Booking transactions",
              "Audit logs for compliance",
            ],
          },
        ],
      },
      technicalDecisions: [
        {
          decision: "Next.js for Full-Stack Framework",
          rationale:
            "Unified TypeScript codebase, API routes co-located with frontend, automatic optimization, and seamless Vercel deployment for serverless scaling.",
          tradeoffs:
            "Monolithic approach vs microservices; chosen for faster iteration and simplified deployment.",
        },
        {
          decision: "PostgreSQL over NoSQL",
          rationale:
            "Schedule data has complex temporal relationships and requires ACID transactions for booking consistency. Strong schema validation prevents data integrity issues.",
          tradeoffs:
            "Less flexible schema vs guaranteed consistency; critical for financial transactions.",
        },
        {
          decision: "Socket.io for Real-time Updates",
          rationale:
            "Trades workers need instant notification of availability matches. WebSocket provides near-zero latency compared to polling.",
          tradeoffs:
            "Requires connection management vs simpler REST approach; necessary for user experience quality.",
        },
        {
          decision: "Clerk for Authentication",
          rationale:
            "Offloads security complexity, provides SAML/OAuth integration, reduces liability for handling sensitive auth data.",
          tradeoffs:
            "Third-party dependency vs custom auth; justified by reduced attack surface.",
        },
        {
          decision: "IBM Watson + Grok AI for Matching",
          rationale:
            "IBM Watson for document analysis (schedule PDFs, contracts), Grok for preference matching. Multi-model approach provides resilience and specialized capabilities.",
          tradeoffs:
            "Dual API dependencies vs single provider; ensures service availability.",
        },
      ],
      technicalImplementation: [
        {
          title: "Dynamic Schedule Parsing",
          description:
            "Transforms multiple input formats (PDF schedules, manual entries, voice recordings) into consistent temporal data structures. Voice is transcribed via Watson, parsed via NLP, and validated against PDF originals.",
          challenge: "Handling conflicting schedule data from different input sources",
          solution:
            "Implemented conflict resolution pipeline: PDF as source of truth, manual entries for weekly patterns, voice for ad-hoc updates. Timestamp-based versioning ensures auditability.",
        },
        {
          title: "Temporal Matching Algorithm",
          description:
            "Core matching engine identifies compatible time windows between families, nannies, and available caregivers. Uses interval intersection logic and preference scoring.",
          challenge:
            "Efficiently computing availability overlaps across thousands of variable schedules",
          solution:
            "Pre-computed interval trees indexed on time blocks; Grok AI scores matches based on preferences, location, and historical compatibility. Results cached and invalidated on schedule changes.",
        },
        {
          title: "Real-time Synchronization",
          description:
            "Socket.io events propagate schedule changes instantly to connected clients. Server maintains room-based subscriptions for families and potential matches.",
          challenge: "Handling race conditions when multiple users update simultaneously",
          solution:
            "Optimistic updates on client; server applies vector clocks for causality tracking and resolves conflicts via last-write-wins with explicit notifications to affected users.",
        },
        {
          title: "Group Chat Coordination",
          description:
            "WebSocket-based private group chats for families and assigned nannies. Messages persisted to PostgreSQL for history.",
          challenge:
            "Ensuring messages are delivered reliably during network disconnections",
          solution:
            "Message queue with delivery receipts; client tracks unacknowledged messages and retries with exponential backoff.",
        },
      ],
      databaseDesign: {
        title: "Data Model & Schema Design",
        description:
          "PostgreSQL schema optimized for temporal queries and booking consistency.",
        keyTables: [
          {
            name: "users",
            columns:
              "id, email, clerk_id, role (parent|nanny|admin), created_at, updated_at",
            indexes: "clerk_id (authentication lookups), role (filtering queries)",
          },
          {
            name: "schedules",
            columns:
              "id, user_id, start_time, end_time, recurring (boolean), recurrence_pattern, source (pdf|manual|voice), version",
            indexes:
              "user_id, (start_time, end_time) - range queries for overlap detection",
          },
          {
            name: "bookings",
            columns:
              "id, family_id, nanny_id, start_date, end_date, status (pending|confirmed|completed), payment_amount, created_at",
            indexes:
              "family_id, nanny_id, status - for transaction integrity and history",
          },
          {
            name: "matches",
            columns:
              "id, family_id, nanny_id, confidence_score, match_reason, created_at, viewed_at",
            indexes:
              "family_id (for match display), created_at (for analytics)",
          },
        ],
      },
      performanceOptimizations: [
        "Indexed temporal queries for schedule overlap detection (critical path)",
        "Connection pooling for Database interactions under concurrent booking",
        "Redis caching layer for frequently accessed matches and user preferences",
        "Client-side debouncing on form inputs to reduce API load during rapid filtering",
        "Image optimization via Next.js Image component (AVIF format for modern browsers)",
        "Lazy-loaded chat history to keep WebSocket message queue manageable",
      ],
      securityConsiderations: [
        {
          aspect: "Authentication",
          implementation:
            "Clerk OAuth providers (Google, GitHub); enforces MFA for accounts managing payments",
        },
        {
          aspect: "Authorization",
          implementation:
            "Role-based access control (RBAC); families cannot view other families' schedules; admins have audit access only",
        },
        {
          aspect: "Data Encryption",
          implementation:
            "TLS 1.3 in transit; sensitive fields (SSN, payment methods) encrypted at rest via AWS KMS",
        },
        {
          aspect: "Compliance",
          implementation:
            "GDPR-compliant data retention policies; audit logs for all financial transactions; SOC 2 Type II certification target",
        },
      ],
      deploymentPipeline: [
        {
          stage: "Development",
          tools: "Next.js dev server with hot reload, local PostgreSQL, Socket.io debug logging",
        },
        {
          stage: "Staging",
          tools:
            "Vercel preview deployments on every PR; automated E2E tests via Playwright",
        },
        {
          stage: "Production",
          tools:
            "Vercel serverless deployment; managed PostgreSQL at Neon; CDN caching via Vercel Edge",
        },
        {
          stage: "Monitoring",
          tools:
            "Axiom for structured logging; Sentry for error tracking; custom dashboards for real-time metrics",
        },
      ],
      keyMetrics: [
        "Average schedule parsing time: <2 seconds for PDF documents",
        "Match generation latency: <500ms end-to-end",
        "Real-time WebSocket message delivery: 99.8% reliability",
        "Database query p99 latency: <100ms for booking lookups",
      ],
    },
    "expense-tracker": {
      title: "Expenses Tracker",
      description:
        "Built a full-stack expense tracking web app with secure authentication, type-safe data handling, and a scalable modern architecture using TypeScript and PostgreSQL.",
      fullDescription:
        "ExpensesApp is a full-stack web application that helps users securely track, manage, and categorize personal expenses in real time. Built with modern, type-safe tooling, it features user authentication, full CRUD functionality, and a scalable architecture for reliable personal finance management.",
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
      features: [
        "Secure user authentication",
        "Create, read, update, and delete (CRUD) expenses",
        "Expense categorization and tracking",
        "Real-time state management",
        "Type-safe database interactions",
        "Responsive, modern UI",
        "Scalable and modular architecture",
      ],
      challenges:
        "Maintaining data consistency and security while managing real-time expense updates across authenticated users.",
      solution:
        "Implemented type-safe APIs with Drizzle ORM and Zod validation alongside secure authentication, ensuring reliable data handling and safe CRUD operations throughout the application.",
    },
    insurflow: {
      title: "InsurFlow - Vero Ventures",
      description:
        "Developed a comprehensive insurance management system with Next.js, TypeScript, and PostgreSQL, featuring user authentication, policy management, claims processing, and real-time notifications.",
      fullDescription:
        "InsurFlow is an AI-integrated InsurTech SaaS platform for life insurance advisors. It modernizes financial needs analysis workflows by replacing archaic spreadsheets with a cutting-edge web application featuring complex financial calculators, interactive dashboards, and GenAI-powered document generation. This is a greenfield v2.0 rebuild - built entirely from scratch using modern architecture, with v1.0 serving only as a functional specification and logic reference.",
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
      features: [
        "Financial Needs Analysis Engines",
        "Interactive Financial Dashboards",
        "GenAI Advisor Co-Pilot",
        "Client & Case Management",
        "Multi-Tenant SaaS Architecture",
        "Authentication & Access Control",
        "Cloud-Native CI/CD & Preview Environments",
        "Structured Logging & Observability",
      ],
      challenges:
        "Translating complex, regulation-heavy insurance calculations from spreadsheet-based logic into a scalable, type-safe web application without introducing financial or compliance errors.",
      solution:
        "Rebuilt all financial engines from scratch using strict TypeScript, Drizzle ORM, and isolated unit tests, treating v1 spreadsheets as a logic spec and validating outputs with test data and edge cases before integrating them into interactive dashboards and AI-generated documents.",
    },
    releaf: {
      title: "ReLeaf",
      description:
        "Releaf is a sustainability-focused app that lets users report wildlife emergencies in real time, join environmental activities, donate to trusted charities, and support causes by purchasing eco-friendly products.",
      fullDescription:
        "Releaf is a sustainability-focused web app built with Next.js, React, JavaScript, and Tailwind CSS, enabling users to report wildlife emergencies via photos, videos, or direct calls to wildlife centres. It also supports environmental group activities, charity donations, and eco-friendly product purchases, with deployment handled through Render.",
      image: "/releaf.jpg",
      technologies: [
        "Next.js",
        "React",
        "JavaScript",
        "Render",
        "Tailwind CSS",
      ],
      githubUrl: "https://github.com/Lam-Thai/environmental-app",
      liveUrl: "https://environmental-app-fawn.vercel.app/login",
      features: [
        "Wildlife emergency reporting (photo, video, call)",
        "Wildlife centre contact system",
        "Environmental activity groups",
        "Organization-hosted events",
        "Charity donationss",
        "Eco-friendly product marketplace",
        "Cause-based fundraising",
        "User accounts & profiles",
        "Secure payment processing",
        "Responsive design",
      ],
      challenges:
        "Ensuring wildlife emergency reports are sent quickly and reliably with media attachments.",
      solution:
        "Implemented optimized media uploads and real-time notifications to route reports instantly to the appropriate wildlife centres.",
    },
    "bandit-breakout": {
      title: "Bandit Breakout",
      description:
        "A turn-based cartoon animal web game with a cowboy vibe, featuring dice-based board movement, dynamic events, and player-vs-player or boss battles, built with TypeScript, JavaScript, Phaser, MongoDB, Mongoose, and Socket.io.",
      fullDescription:
        "A turn-based cartoon animal web game with a bold cowboy vibe, where players roll dice to move across the board, triggering events and strategic battles. Built with TypeScript, JavaScript, Phaser, MongoDB, Mongoose, and Socket.io to deliver real-time multiplayer gameplay. Players can engage in PvP duels or team up against challenging boss battles, all while navigating dynamic events that keep the gameplay exciting and unpredictable.",
      image: "/bandit-breakout.svg",
      technologies: [
        "TypeScript",
        "JavaScript",
        "Phaser",
        "MongoDB",
        "Mongoose",
        "Socket.io",
      ],
      githubUrl: "https://github.com/BB-CommandZ/BanditBreakout",
      liveUrl: "http://commandz.gochatus.org:30006/",
      features: [
        "In-game shop for special equipment and consumables",
        "Dice-based board movement",
        "Boss battles with unique mechanics",
        "Player duels (PvP)",
        "Random map events",
        "Quests and progression system",
        "Reward system with in-game currency",
        "Multiplayer matchmaking",
        "Character selection",
      ],
      challenges:
        "Keeping turn-based gameplay smooth and fair in a real-time multiplayer environment.",
      solution:
        "Used Socket.io to synchronize turns and game state across players, ensuring consistent and responsive gameplay.",
    },
    "image-converter": {
      title: "Image Converter",
      description:
        "Built an image converter and filter app that allows users to upload photos, apply real-time visual effects, and export images in multiple formats through a fast, intuitive interface.",
      fullDescription:
        "A comprehensive image converter and filter app that allows users to upload photos, apply real-time visual effects, and export images in multiple formats through a fast, intuitive interface.",
      image: "/image-converter.avif",
      technologies: ["JavaScript"],
      githubUrl: "https://github.com/Lam-Thai/image-lab",
      liveUrl: "https://github.com/Lam-Thai/image-lab",
      features: [
        "Image upload with instant preview",
        "Real-time filter application (grayscale, sepia, blur, etc.)",
        "Image format conversion (JPG, PNG, WebP)",
        "Responsive, user-friendly interface",
        "Error handling for unsupported files",
      ],
      challenges:
        "Maintaining smooth performance while applying real-time image filters without causing UI lag on large image files.",
      solution:
        "Implemented client-side image processing with optimized rendering and debounced filter updates to ensure responsive, real-time previews without blocking the UI.",
    },
  };

  const project = projects[projectId];

  if (!project) {
    return (
      <div className="relative min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden">
        <NavBar />
        <main className="relative z-10 max-w-7xl mx-auto px-6 pt-32 pb-20 text-center">
          <h1 className="text-4xl font-bold text-white mb-4">
            Project Not Found
          </h1>
          <Link
            href="/work"
            className="text-orange-400 hover:text-orange-300 transition-colors"
          >
            ← Back to Projects
          </Link>
        </main>
      </div>
    );
  }

  const figmaEmbedUrl =
    projectId === "tandem" && project.figmaDesignUrl
      ? `https://www.figma.com/embed?embed_host=share&url=${encodeURIComponent(project.figmaDesignUrl)}`
      : null;

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-black via-zinc-900 to-black overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,black,transparent)]"></div>

      {/* Glowing orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>

      <NavBar />

      <main className="relative z-10 max-w-5xl mx-auto px-6 pt-32 pb-20">
        {/* Back Button */}
        <Link
          href="/work"
          className="inline-flex items-center gap-2 text-zinc-400 hover:text-orange-400 transition-colors mb-8"
        >
          <svg
            className="w-5 h-5"
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
          Back to Projects
        </Link>

        {/* Project Header */}
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {project.title}
          </h1>
          <p className="text-xl text-zinc-400 mb-6">{project.description}</p>

          {/* Technologies */}
          <div className="flex flex-wrap gap-2 mb-6">
            {project.technologies.map((tech, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 rounded-full text-orange-400 text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <a
              href={project.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg font-medium hover:bg-zinc-700 hover:border-orange-500/50 transition-all"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path
                  fillRule="evenodd"
                  d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                  clipRule="evenodd"
                />
              </svg>
              View Code
            </a>
            {projectId === "tandem" && project.blogUrl && (
              <a
                href={project.blogUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-6 py-3 bg-zinc-800 border border-zinc-700 text-white rounded-lg font-medium hover:bg-zinc-700 hover:border-orange-500/50 transition-all"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                  />
                </svg>
                View Blog
              </a>
            )}
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-amber-600 transition-all"
            >
              <svg
                className="w-5 h-5"
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
              Live Demo
            </a>
          </div>
        </div>

        {/* Project Image */}
        <div className="relative w-full h-96 mb-12 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center bg-zinc-900">
          <Image
            src={project.image}
            alt={project.title}
            fill
            className={
              projectId === "insurflow" || projectId === "tandem"
                ? "object-contain p-12"
                : "object-cover"
            }
            priority
          />
        </div>

        {projectId === "tandem" && figmaEmbedUrl && (
          <section className="mb-12 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
              <div>
                <h2 className="text-2xl font-bold text-orange-400">
                  Hi-Fi Figma Design
                </h2>
                <p className="text-sm text-zinc-400 mt-1">
                  View-only prototype preview. Editing and commenting are disabled.
                </p>
              </div>
              <a
                href={project.figmaDesignUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-zinc-800 border border-zinc-700 text-white rounded-lg font-medium hover:bg-zinc-700 hover:border-orange-500/50 transition-all"
              >
                Open In Figma
              </a>
            </div>
            <div className="w-full h-105 md:h-140 rounded-xl overflow-hidden border border-zinc-700 bg-zinc-950">
              <iframe
                src={figmaEmbedUrl}
                title="Tandem Hi-Fi Figma Design"
                className="w-full h-full"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {/* Project Details */}
        {project.isCaseStudy ? (
          <>
            {/* TECHNICAL CASE STUDY LAYOUT */}
            <div className="space-y-8 max-w-4xl">
              {/* Problem Statement */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-4">
                  Problem Statement
                </h2>
                <p className="text-zinc-300 leading-relaxed">
                  {project.problemStatement}
                </p>
              </div>

              {/* Solution Overview */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-4">
                  Technical Solution
                </h2>
                <p className="text-zinc-300 leading-relaxed">
                  {project.solutionOverview}
                </p>
              </div>

              {/* Architecture */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-4">
                  {project.architecture.title}
                </h2>
                <p className="text-zinc-300 mb-6">{project.architecture.overview}</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.architecture.components.map((component, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4"
                    >
                      <h3 className="font-bold text-orange-400 mb-2">
                        {component.name}
                      </h3>
                      <p className="text-sm text-zinc-400 mb-3">
                        {component.description}
                      </p>
                      <ul className="space-y-1">
                        {component.responsibilities.map((resp, i) => (
                          <li
                            key={i}
                            className="text-xs text-zinc-300 flex items-start gap-2"
                          >
                            <span className="text-orange-400 mt-0.5">•</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Decisions */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-6">
                  Key Technical Decisions
                </h2>
                <div className="space-y-6">
                  {project.technicalDecisions.map((decision, idx) => (
                    <div key={idx} className="border-l-2 border-orange-400 pl-4">
                      <h3 className="font-bold text-white mb-2">
                        {decision.decision}
                      </h3>
                      <div className="space-y-2 text-sm">
                        <p className="text-zinc-300">
                          <span className="font-semibold text-orange-400">
                            Rationale:{" "}
                          </span>
                          {decision.rationale}
                        </p>
                        <p className="text-zinc-400">
                          <span className="font-semibold text-orange-400">
                            Tradeoffs:{" "}
                          </span>
                          {decision.tradeoffs}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Technical Implementation */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-6">
                  Implementation Highlights
                </h2>
                <div className="space-y-6">
                  {project.technicalImplementation.map((impl, idx) => (
                    <div key={idx} className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4">
                      <h3 className="font-bold text-white mb-2">{impl.title}</h3>
                      <p className="text-zinc-300 text-sm mb-3">
                        {impl.description}
                      </p>
                      <div className="space-y-2 text-sm">
                        <p className="text-zinc-400">
                          <span className="font-semibold text-orange-400">
                            Challenge:{" "}
                          </span>
                          {impl.challenge}
                        </p>
                        <p className="text-zinc-400">
                          <span className="font-semibold text-orange-400">
                            Solution:{" "}
                          </span>
                          {impl.solution}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Database Design */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-4">
                  {project.databaseDesign.title}
                </h2>
                <p className="text-zinc-300 mb-6">
                  {project.databaseDesign.description}
                </p>
                <div className="space-y-4">
                  {project.databaseDesign.keyTables.map((table, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-4"
                    >
                      <h3 className="font-mono font-bold text-orange-400 mb-2">
                        {table.name}
                      </h3>
                      <p className="text-xs text-zinc-400 mb-2 font-mono">
                        Columns: {table.columns}
                      </p>
                      <p className="text-xs text-zinc-400 font-mono">
                        Indexes: {table.indexes}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Optimizations */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-4">
                  Performance Optimizations
                </h2>
                <ul className="space-y-3">
                  {project.performanceOptimizations.map((opt, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-zinc-300">
                      <span className="text-orange-400 mt-1">⚡</span>
                      <span>{opt}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Security Considerations */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-6">
                  Security Considerations
                </h2>
                <div className="space-y-4">
                  {project.securityConsiderations.map((sec, idx) => (
                    <div key={idx} className="border-l-2 border-orange-400 pl-4">
                      <h3 className="font-bold text-white mb-1">
                        {sec.aspect}
                      </h3>
                      <p className="text-sm text-zinc-300">
                        {sec.implementation}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deployment Pipeline */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-6">
                  Deployment Pipeline
                </h2>
                <div className="space-y-3">
                  {project.deploymentPipeline.map((stage, idx) => (
                    <div key={idx} className="bg-zinc-800/30 border border-zinc-700 rounded-lg p-4">
                      <h3 className="font-bold text-white mb-1">{stage.stage}</h3>
                      <p className="text-sm text-zinc-300 font-mono">
                        {stage.tools}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Key Metrics */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                <h2 className="text-2xl font-bold text-orange-400 mb-4">
                  Key Performance Metrics
                </h2>
                <ul className="space-y-2">
                  {project.keyMetrics.map((metric, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 text-zinc-300 text-sm"
                    >
                      <span className="text-orange-400 mt-1">📊</span>
                      <span>{metric}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Technologies Sidebar */}
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-8">
                <h3 className="text-lg font-bold text-white mb-4">
                  Technology Stack
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  About This Project
                </h2>
                <p className="text-zinc-300 leading-relaxed">
                  {project.fullDescription}
                </p>
              </div>

              {/* Video Showcase - Only for Bandit Breakout */}
              {projectId === "bandit-breakout" && (
                <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                  <h2 className="text-2xl font-bold text-white mb-4">
                    Gameplay Preview
                  </h2>
                  <div className="relative w-full rounded-lg overflow-hidden">
                    <video className="w-full h-auto" controls preload="metadata">
                      <source src="/bandit-breakout.mp4" type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                </div>
              )}

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Key Features
                </h2>
                <ul className="space-y-3">
                  {project.features.map((feature, index) => (
                    <li
                      key={index}
                      className="flex items-start gap-3 text-zinc-300"
                    >
                      <span className="text-orange-400 mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h2 className="text-2xl font-bold text-white mb-4">
                  Challenges & Solutions
                </h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-400 mb-2">
                      Challenge
                    </h3>
                    <p className="text-zinc-300">{project.challenges}</p>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-orange-400 mb-2">
                      Solution
                    </h3>
                    <p className="text-zinc-300">{project.solution}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">
                  Technologies
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-zinc-800 border border-zinc-700 rounded text-zinc-300 text-sm"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>


            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-6">
              <h3 className="text-lg font-bold text-white mb-4">Links</h3>
              <div className="space-y-3">
                <a
                  href={project.githubUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      fillRule="evenodd"
                      d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                  View Source Code
                </a>
                {projectId === "tandem" && project.blogUrl && (
                  <a
                    href={project.blogUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
                      />
                    </svg>
                    Read Blog
                  </a>
                )}
                <a
                  href={project.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <svg
                    className="w-5 h-5"
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
                  Visit Live Site
                </a>
              </div>
            </div>
          </div>
          </div>
        )}
      </main>
    </div>
  );
}
