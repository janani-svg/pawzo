import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { PawzoProvider } from "./lib/store";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "PAWZO — A warm hug for your pet's whole life",
  description:
    "Track health, feeding, meds, growth, and memories — and reach an emergency vet fast. PAWZO keeps everything about your pet in one happy place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${poppins.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <PawzoProvider>{children}</PawzoProvider>
      </body>
    </html>
  );
}
