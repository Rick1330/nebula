import { NextResponse } from "next/server";
import { AccessToken } from "livekit-server-sdk";

export async function GET() {
	const url = process.env.LIVEKIT_URL;
	const apiKey = process.env.LIVEKIT_API_KEY;
	const apiSecret = process.env.LIVEKIT_API_SECRET;

	if (!url) {
		console.error("LIVEKIT_URL missing");
		return NextResponse.json({ error: "LIVEKIT_URL missing" }, { status: 500 });
	}
	if (!apiKey) {
		console.error("LIVEKIT_API_KEY missing");
		return NextResponse.json({ error: "LIVEKIT_API_KEY missing" }, { status: 500 });
	}
	if (!apiSecret) {
		console.error("LIVEKIT_API_SECRET missing");
		return NextResponse.json({ error: "LIVEKIT_API_SECRET missing" }, { status: 500 });
	}

	const identity = `user-${Math.random().toString(36).slice(2)}`;
	const room = "nebula-demo";

	const at = new AccessToken(apiKey, apiSecret, { identity });
	at.addGrant({ room, roomJoin: true, canPublish: true, canSubscribe: true });
	const token = await at.toJwt();

	return NextResponse.json({ url, token, room, identity });
}
