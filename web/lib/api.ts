import { NextResponse } from "next/server";

export function json<T>(data: T, init?: number | ResponseInit) {
	const responseInit: ResponseInit | undefined =
		typeof init === "number" ? { status: init } : init;
	return NextResponse.json(data, responseInit);
}

export function error(message: string, status = 400, extra?: Record<string, unknown>) {
	return NextResponse.json({ error: message, ...extra }, { status });
}

