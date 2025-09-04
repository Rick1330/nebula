"use client";

import * as React from "react";

export default function PresencePage() {
	const [online, setOnline] = React.useState<number>(0);
	const [error, setError] = React.useState<string | null>(null);

	React.useEffect(() => {
		let mounted = true;
		async function poll() {
			try {
				const res = await fetch("/api/realtime/presence", { cache: "no-store" });
				const data = await res.json();
				if (!mounted) return;
				if (res.ok) {
					setOnline(Number(data.online ?? 0));
					setError(null);
				} else {
					setError(data?.error ?? `status ${res.status}`);
				}
			} catch (e) {
				if (!mounted) return;
				setError((e as Error).message);
			}
			setTimeout(poll, 2000);
		}
		poll();
		return () => {
			mounted = false;
		};
	}, []);

	return (
		<div className="flex min-h-screen items-center justify-center p-8">
			<div className="rounded-lg border p-6 shadow">
				<h1 className="text-2xl font-semibold">Realtime Presence</h1>
				<p className="mt-2 text-sm text-gray-500">Online connections</p>
				<p className="mt-4 text-5xl font-bold">{online}</p>
				{error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
			</div>
		</div>
	);
}
