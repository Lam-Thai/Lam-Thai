// Data for the 3D "Game Mode" world.
// Each milestone maps a portfolio project to a character in the medieval
// realm. Landmarks map site pages (About / Contact) to world structures.
// Positions are [x, z] on the terrain; the player spawns near the origin
// and the mountain sits far to the north (negative z).

export const MILESTONES = [
  {
    id: "bookstore",
    title: "Bookstore",
    subtitle: "C# · .NET · Blazor",
    character: "villager",
    href: "/work/bookstore",
    position: [-16, 4],
  },
  {
    id: "subsave",
    title: "SubSave",
    subtitle: "Next.js · Prisma · Gemini",
    character: "villager",
    href: "/work/subsave",
    position: [16, 2],
  },
  {
    id: "landly",
    title: "Landly",
    subtitle: "Next.js 15 · Stripe · Clerk",
    character: "knight",
    href: "/work/landly",
    position: [-32, -22],
  },
  {
    id: "tandem",
    title: "Tandem",
    subtitle: "Full-stack · AI Case Study",
    character: "knight",
    href: "/work/tandem",
    position: [30, -18],
  },
  {
    id: "bandit-breakout",
    title: "Bandit Breakout",
    subtitle: "Phaser · Socket.io Game",
    character: "monster",
    href: "/work/bandit-breakout",
    position: [-46, -52],
  },
  {
    id: "insurflow",
    title: "InsurFlow",
    subtitle: "InsurTech SaaS · Vero Ventures",
    character: "dragon",
    href: "/work/insurflow",
    position: [-10, -76],
  },
  {
    id: "fpt",
    title: "FPT University",
    subtitle: "Graphic Design Bachelor",
    character: "villager",
    href: "/design/fpt",
    position: [46, -34],
  },
  {
    id: "hongik",
    title: "Hongik University",
    subtitle: "Design Exchange · Seoul",
    character: "monster",
    href: "/design/hongik",
    position: [56, -50],
  },
];

export const LANDMARKS = {
  windmill: {
    label: "Experience\nEducation",
    title: "Experience - Education",
    href: "/about",
    position: [38, -42],
  },
  mountain: {
    label: "CONTACT ME",
    title: "Contact Me",
    href: "/contact",
    position: [0, -122],
  },
};

export const WORLD_RADIUS = 150;
export const PLAYER_SPAWN = [0, 32];

// Only these same-origin paths may be opened inside the game popup.
const POPUP_ALLOWED_PREFIXES = ["/work/", "/design/", "/about", "/contact"];

export function isAllowedPopupHref(href) {
  return (
    typeof href === "string" &&
    href.startsWith("/") &&
    !href.startsWith("//") &&
    POPUP_ALLOWED_PREFIXES.some(
      (prefix) => href === prefix || href.startsWith(prefix)
    )
  );
}
