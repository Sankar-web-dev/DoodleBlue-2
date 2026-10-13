import { Oxanium } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";

const oxanium = Oxanium({
  variable: "--font-oxanium",
  subsets: ["latin"],
  display: "swap",
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${oxanium.variable} ${oxanium.className} antialiased font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
