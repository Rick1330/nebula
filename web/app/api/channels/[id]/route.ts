import { getPrismaClient } from "@/app/lib/prisma";
import { json, error } from "@/lib/api";
import { updateChannelSchema } from "@/lib/schemas";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
	const prisma = getPrismaClient();
	try {
		const deleted = await prisma.channel.delete({ where: { id: params.id } });
		return json({ channel: deleted });
	} catch (e: any) {
		return error("Failed to delete channel", 500, { message: e?.message });
	}
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
	const prisma = getPrismaClient();
	const body = await req.json().catch(() => null);
	const parsed = updateChannelSchema.safeParse(body);
	if (!parsed.success) return error("Invalid payload", 400, { issues: parsed.error.flatten() });
	try {
		const existing = await prisma.channel.findUnique({ where: { id: params.id } });
		if (!existing) return error("channel not found", 404);
		const updated = await prisma.channel.update({ where: { id: params.id }, data: { name: parsed.data.name } });
		return json({ channel: updated });
	} catch (e: any) {
		const msg = e?.message as string;
		if (msg && msg.includes("Unique constraint failed")) {
			return error("name already exists in this workspace", 409);
		}
		return error("Failed to update channel", 500, { message: msg });
	}
}
