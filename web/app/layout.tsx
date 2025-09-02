import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { NebulaLogo } from "@/components/nebula-logo";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Nebula",
	description: "Real-time collaboration and chat",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body className={`${inter.className} min-h-dvh bg-background text-foreground antialiased`}>
				<Providers>
					<header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
						<div className="mx-auto flex h-12 max-w-6xl items-center px-4">
							<NebulaLogo />
						</div>
					</header>
					<main className="mx-auto max-w-6xl p-4">{children}</main>
				</Providers>
			</body>
		</html>
	);
}
