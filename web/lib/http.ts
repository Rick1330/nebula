export async function fetchJson<T>(input: RequestInfo | URL, init?: RequestInit): Promise<T> {
	const response = await fetch(input, init);
	if (!response.ok) {
		let message = `Request failed (${response.status})`;
		try {
			const body = await response.json();
			// Support both { message } and { error }
			message = (body?.message as string) ?? (body?.error as string) ?? message;
		} catch {
			// ignore JSON parse errors
		}
		throw new Error(message);
	}
	return (await response.json()) as T;
}

export type ApiListResponse<T> = { items?: T[]; data?: T[] } & Record<string, unknown>;

export function extractList<T>(res: ApiListResponse<T>, keyCandidates: string[] = ["items", "data", "channels", "results"]): T[] {
	for (const key of keyCandidates) {
		const v = (res as Record<string, unknown>)[key];
		if (Array.isArray(v)) return v as T[];
	}
	return [];
}


