export function encodeAssetPath(path) {
  const segments = path.split("/").filter(Boolean);
  return `/${segments.map(encodeURIComponent).join("/")}`;
}

export function getAssetPath(folder, file) {
  return `/design/${folder}/${file}`;
}

function asset(folder, file, label) {
  return {
    path: getAssetPath(folder, file),
    label: label ?? file.replace(/\.[^.]+$/, "").replace(/[_-]/g, " "),
  };
}

export const designEntries = {
  fpt: {
    id: "fpt",
    title: "FPT University",
    subtitle: "Graphic Design Bachelor",
    date: "Oct 2021 — Dec 2023",
    description:
      "Coursework and projects spanning branding, editorial layouts, 3D asset creation, photography, and a curated portfolio of visual design work.",
    details: ["Illustrations", "3D", "Photograph", "Portfolio"],
    thumb: "/fpt-uni.jpg",
    categories: [
      {
        id: "3d",
        label: "3D",
        assets: [
          asset("3D", "3D_FRONT.png", "3D Front View"),
          asset("3D", "3D_LEFT.png", "3D Left View"),
          asset("3D", "3D_TOP.png", "3D Top View"),
          asset("3D", "6_can_box_3d.jpg", "6 Can Box 3D"),
        ],
      },
      {
        id: "illustrations",
        label: "Illustrations",
        assets: [
          asset("illustrations", "postcards.pdf", "Postcards"),
          asset("illustrations", "postcards 2.pdf", "Postcards II"),
          asset("illustrations", "postcards 3.pdf", "Postcards III"),
          asset("illustrations", "LAAM 72 IDEAS (1).pdf", "LAAM 72 Ideas"),
        ],
      },
      {
        id: "photograph",
        label: "Photograph",
        assets: [asset("photograph", "PFD.pdf", "Photography")],
      },
      {
        id: "portfolio",
        label: "Portfolio",
        assets: [
          asset(
            "portfolio",
            "Tuoc Lam Thai's Portfolio_compressed.pdf",
            "Portfolio"
          ),
        ],
      },
    ],
  },
  hongik: {
    id: "hongik",
    title: "Hongik University",
    subtitle: "Exchange program",
    date: "Feb 2023 — Jun 2023",
    description:
      "Exchange semester focused on typography, web research, and magazine design, exploring layout systems, type-setting, and print workflows.",
    details: ["Typography", "Magazine", "Web Research"],
    thumb: "/hongik-uni.jpg",
    categories: [
      {
        id: "typography",
        label: "Typography & Web Research",
        assets: [
          asset(
            "typography",
            "Hawaii_edition_typography.pdf",
            "Hawaii Edition Typography"
          ),
          asset(
            "typography",
            "web research_compressed.pdf",
            "Web Research"
          ),
        ],
      },
      {
        id: "magazine",
        label: "Magazine",
        assets: [
          asset("magazine", "research1.pdf", "Magazine Research"),
          asset(
            "magazine",
            "8 slides of emagazine.pdf",
            "E-Magazine Slides"
          ),
        ],
      },
    ],
  },
};

export function getDesignEntry(id) {
  return designEntries[id] ?? null;
}

export function getDesignEntryList() {
  return Object.values(designEntries);
}

export function isPdfAsset(path) {
  return path.toLowerCase().endsWith(".pdf");
}

export function isImageAsset(path) {
  return /\.(png|jpe?g|gif|webp|svg|avif)$/i.test(path);
}
