import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Agentic OS — Personal Life Operating System",
  description: "A calm, local-first command center for an intentional life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de">
      <body>
        <a className="zeroMode" href="/usage">
          KOSTENKONTROLLE <span>Lokal & kostenlos als Standard</span>
        </a>
        {children}
      </body>
    </html>
  );
}
