"use client";

import { signIn } from "next-auth/react";
import * as React from "react";

export default function LoginPage() {
	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [error, setError] = React.useState<string | null>(null);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		const res = await signIn("credentials", { redirect: false, email, password });
		if (res?.error) setError(res.error);
		if (res?.ok) window.location.href = "/";
	}

	return (
		<div className="flex min-h-screen items-center justify-center p-8">
			<form onSubmit={onSubmit} className="rounded border p-6 space-y-3 w-full max-w-sm">
				<h1 className="text-xl font-semibold">Sign in</h1>
				<div>
					<label className="block text-sm font-medium">Email</label>
					<input className="border rounded px-3 py-2 w-full" value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
				</div>
				<div>
					<label className="block text-sm font-medium">Password</label>
					<input className="border rounded px-3 py-2 w-full" value={password} onChange={(e) => setPassword(e.target.value)} type="password" required />
				</div>
				{error ? <p className="text-sm text-red-600">{error}</p> : null}
				<button type="submit" className="border rounded px-4 py-2 w-full">Continue</button>
			</form>
		</div>
	);
}
