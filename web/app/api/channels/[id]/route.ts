import { getPrismaClient } from "@/app/lib/prisma";
import { json, error } from "@/lib/api";
import { updateChannelSchema } from "@/lib/schemas";

type PlainParams = { id: string };

type ParamContext = { params: PlainParams } | { params: Promise<PlainParams> };

function isPromise<T>(value: unknown): value is Promise<T> {
	return typeof (value as { then?: unknown })?.then === "function";
}

export async function DELETE(_req: Request, context: ParamContext) {
	const prisma = getPrismaClient();
	const params = isPromise<PlainParams>(context.params) ? await context.params : context.params;
	try {
		const deleted = await prisma.channel.delete({ where: { id: params.id } });
		return json({ channel: deleted });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		return error("Failed to delete channel", 500, { message: msg });
	}
}

export async function PATCH(req: Request, context: ParamContext) {
	const prisma = getPrismaClient();
	const params = isPromise<PlainParams>(context.params) ? await context.params : context.params;
	const body = await req.json().catch(() => null);
	const parsed = updateChannelSchema.safeParse(body);
	if (!parsed.success) return error("Invalid payload", 400, { issues: parsed.error.flatten() });
	try {
		const existing = await prisma.channel.findUnique({ where: { id: params.id } });
		if (!existing) return error("channel not found", 404);
		const updated = await prisma.channel.update({ where: { id: params.id }, data: { name: parsed.data.name } });
		return json({ channel: updated });
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : String(e);
		if (msg.includes("Unique constraint failed")) {
			return error("name already exists in this workspace", 409);
		}
		return error("Failed to update channel", 500, { message: msg });
	}
}
