import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Knock Box API Server",
  description: "Backend for VR Door-to-Door Training Application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
