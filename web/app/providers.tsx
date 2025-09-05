"use client";

import { ReactNode, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "@/components/theme-provider";
import { SessionProvider } from "next-auth/react";

export function Providers({ children }: { children: ReactNode }) {
	const [queryClient] = useState(() => new QueryClient());
	return (
		<ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
			<SessionProvider>
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			</SessionProvider>
		</ThemeProvider>
	);
}
