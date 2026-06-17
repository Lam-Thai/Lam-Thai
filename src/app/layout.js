import { Anek_Latin } from "next/font/google";
import "./globals.css";

const anekLatin = Anek_Latin({
  variable: "--font-anek-latin",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export const metadata = {
  title: "Lam Thai - Full-stack Developer",
  description:
    "Create web applications with clean and scalable code. Full-stack web developer specializing in intuitive front-end experiences and robust back-end systems.",
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${anekLatin.variable} antialiased`}>{children}</body>
    </html>
  );
}
