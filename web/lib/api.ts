import { NextResponse } from "next/server";

export function json<T>(data: T, init?: number | ResponseInit) {
	return NextResponse.json(data, init);
}

export function error(message: string, status = 400, extra?: Record<string, unknown>) {
	return NextResponse.json({ error: message, ...extra }, { status });
}

