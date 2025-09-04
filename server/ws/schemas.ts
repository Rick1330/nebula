import { z } from "zod";

// Versioning for WS events (forward/backward compatible design)
export const wsEventVersion = z.literal("v1");
export type WsEventVersion = z.infer<typeof wsEventVersion>;

// Client -> Server events
// ping: no args
const pingArgsSchema = z.tuple([]);

export const clientToServerEventSchemas = {
	ping: pingArgsSchema,
};

export type ClientToServerEventName = keyof typeof clientToServerEventSchemas;

export function validateEvent(event: string, args: unknown[]): { ok: true } | { ok: false; error: string } {
	const schema = (clientToServerEventSchemas as Record<string, z.ZodTypeAny>)[event];
	if (!schema) return { ok: true }; // allow unknown events for now (extensibility)
	const result = schema.safeParse(args);
	if (result.success) return { ok: true };
	return { ok: false, error: result.error.message };
}
