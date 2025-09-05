import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { z } from "zod";

const credentialsSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
});

export const authOptions = {
	providers: [
		Credentials({
			name: "Credentials",
			credentials: {
				email: { label: "Email", type: "email" },
				password: { label: "Password", type: "password" },
			},
			async authorize(credentials) {
				try {
					const parsed = credentialsSchema.safeParse(credentials);
					if (!parsed.success) return null;
					// TODO: Replace with real user lookup & password verify
					if (parsed.data.email && parsed.data.password) {
						return { id: parsed.data.email, name: parsed.data.email, email: parsed.data.email } as any;
					}
					return null;
				} catch {
					return null;
				}
			},
		}),
	],
	pages: {
		signIn: "/login",
	},
	secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
