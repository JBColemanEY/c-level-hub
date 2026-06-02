import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import Sidebar from "@/components/layout/Sidebar";

const poppins = Poppins({ subsets: ["latin"], weight: ["300", "400", "500", "600", "700", "800"] });

export const metadata: Metadata = {
  title: "Entity Y · C-Suite Hub",
  description: "Strategic command centre for Entity Y",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${poppins.className} bg-[#1e1e1e] min-h-screen flex`}>
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-hidden">
          {children}
        </main>
      </body>
    </html>
  );
}
