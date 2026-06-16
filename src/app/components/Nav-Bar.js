"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function NavBar() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
  }, [isMobileMenuOpen]);

  const handleLinkClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-black/80 backdrop-blur-lg border-b border-zinc-800/50 shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link
            href="/"
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={handleLinkClick}
          >
            <Image
              src="/logo.svg"
              alt="Logo"
              width={120}
              height={30}
              className="brightness-0 saturate-100 invert sepia hue-rotate-[10deg] saturate-[5]"
              style={{
                filter:
                  "brightness(0) saturate(100%) invert(58%) sepia(89%) saturate(2476%) hue-rotate(1deg) brightness(102%) contrast(101%)",
              }}
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8 text-base font-medium">
            <Link
              href="/work"
              className="text-zinc-400 hover:text-orange-400 hover:scale-125 transition-all duration-300 origin-center"
            >
              Development
            </Link>
            <Link
              href="/design"
              className="text-zinc-400 hover:text-orange-400 hover:scale-125 transition-all duration-300 origin-center"
            >
              Design
            </Link>
            <Link
              href="/about"
              className="text-zinc-400 hover:text-orange-400 hover:scale-125 transition-all duration-300 origin-center"
            >
              About
            </Link>
            <Link
              href="/interests"
              className="text-zinc-400 hover:text-orange-400 hover:scale-125 transition-all duration-300 origin-center"
            >
              Interests
            </Link>
            <Link
              href="/contact"
              className="text-zinc-400 hover:text-orange-400 hover:scale-125 transition-all duration-300 origin-center"
            >
              Contact
            </Link>
          </nav>

          {/* Mobile Hamburger Button */}
          <button
            className="md:hidden relative w-10 h-10 text-zinc-400 hover:text-orange-400 transition-colors focus:outline-none"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <span
                className={`block w-6 h-0.5 bg-current mb-1.5 transition-all duration-300 ${
                  isMobileMenuOpen
                    ? "rotate-45 translate-y-2"
                    : "rotate-0 translate-y-0"
                }`}
              ></span>
              <span
                className={`block w-6 h-0.5 bg-current mb-1.5 transition-all duration-300 ${
                  isMobileMenuOpen ? "opacity-0" : "opacity-100"
                }`}
              ></span>
              <span
                className={`block w-6 h-0.5 bg-current transition-all duration-300 ${
                  isMobileMenuOpen
                    ? "-rotate-45 -translate-y-2"
                    : "rotate-0 translate-y-0"
                }`}
              ></span>
            </div>
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300 ${
          isMobileMenuOpen
            ? "opacity-100 pointer-events-auto"
            : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>

      {/* Mobile Menu */}
      <nav
        className={`fixed top-[72px] right-0 bottom-0 w-64 bg-black/95 backdrop-blur-lg border-l border-zinc-800 z-40 md:hidden transition-transform duration-300 ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col gap-2 p-6">
          <Link
            href="/work"
            className="text-zinc-400 hover:text-orange-400 py-3 px-4 rounded-lg hover:bg-zinc-800/50 transition-all text-lg font-medium"
            onClick={handleLinkClick}
          >
            Development
          </Link>
          <Link
            href="/design"
            className="text-zinc-400 hover:text-orange-400 py-3 px-4 rounded-lg hover:bg-zinc-800/50 transition-all text-lg font-medium"
            onClick={handleLinkClick}
          >
            Design
          </Link>
          <Link
            href="/about"
            className="text-zinc-400 hover:text-orange-400 py-3 px-4 rounded-lg hover:bg-zinc-800/50 transition-all text-lg font-medium"
            onClick={handleLinkClick}
          >
            About
          </Link>
          <Link
            href="/interests"
            className="text-zinc-400 hover:text-orange-400 py-3 px-4 rounded-lg hover:bg-zinc-800/50 transition-all text-lg font-medium"
            onClick={handleLinkClick}
          >
            Interests
          </Link>
          <Link
            href="/contact"
            className="text-zinc-400 hover:text-orange-400 py-3 px-4 rounded-lg hover:bg-zinc-800/50 transition-all text-lg font-medium"
            onClick={handleLinkClick}
          >
            Contact
          </Link>
        </div>
      </nav>
    </>
  );
}
