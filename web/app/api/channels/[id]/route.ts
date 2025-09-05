import { getPrismaClient } from "@/app/lib/prisma";
import { json, error } from "@/lib/api";
import { updateChannelSchema } from "@/lib/schemas";
import { getServerSession } from "next-auth";

type PlainParams = { id: string };

type ParamContext = { params: PlainParams } | { params: Promise<PlainParams> };

function isPromise<T>(value: unknown): value is Promise<T> {
	return typeof (value as { then?: unknown })?.then === "function";
}

async function getParams(context: ParamContext): Promise<PlainParams> {
	return isPromise<PlainParams>(context.params) ? await context.params : context.params;
}

async function parseUpdateBody(req: Request) {
	const body = await req.json().catch(() => null);
	const parsed = updateChannelSchema.safeParse(body);
	if (!parsed.success) {
		return { ok: false as const, issues: parsed.error.flatten() };
	}
	return { ok: true as const, data: parsed.data };
}

function mapPrismaError(e: unknown) {
	const msg = e instanceof Error ? e.message : String(e);
	if (msg.includes("Unique constraint failed")) {
		return error("name already exists in this workspace", 409);
	}
	if (msg.includes("Record to update not found")) {
		return error("channel not found", 404);
	}
	return error("Failed to update channel", 500, { message: msg });
}

export async function DELETE(_req: Request, context: ParamContext) {
	const session = await getServerSession();
	if (!session) return error("Unauthorized", 401);
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
	const session = await getServerSession();
	if (!session) return error("Unauthorized", 401);
	const prisma = getPrismaClient();
	const params = await getParams(context);
	const parsed = await parseUpdateBody(req);
	if (!parsed.ok) return error("Invalid payload", 400, { issues: parsed.issues });
	try {
		const updated = await prisma.channel.update({ where: { id: params.id }, data: { name: parsed.data.name } });
		return json({ channel: updated });
	} catch (e: unknown) {
		return mapPrismaError(e);
	}
}
