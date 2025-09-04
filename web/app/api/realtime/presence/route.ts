import { NextResponse } from "next/server";

export async function GET() {
	const origin = process.env.REALTIME_HTTP_ORIGIN ?? "http://localhost:4001";
	try {
		const res = await fetch(`${origin}/presence`, { cache: "no-store" });
		const data = await res.json();
		return NextResponse.json(data, { status: res.ok ? 200 : res.status });
	} catch (err) {
		return NextResponse.json({ online: 0, error: (err as Error).message }, { status: 502 });
	}
}
