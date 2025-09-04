import { getPrismaClient } from "@/app/lib/prisma";
import { json, error } from "@/lib/api";
import { createChannelSchema } from "@/lib/schemas";

export async function POST(req: Request) {
	const body = await req.json().catch(() => null);
	const parsed = createChannelSchema.safeParse(body);
	if (!parsed.success) return error("Invalid payload", 400, { issues: parsed.error.flatten() });
	const prisma = getPrismaClient();
	try {
		const workspace = await prisma.workspace.findUnique({ where: { id: parsed.data.workspaceId } });
		if (!workspace) return error("workspace not found", 404);
		const channel = await prisma.channel.create({
			data: {
				name: parsed.data.name,
				workspaceId: parsed.data.workspaceId,
				type: parsed.data.type,
			},
		});
		return json({ channel });
	} catch (e) {
		return error("Failed to create channel", 500, { message: (e as Error).message });
	}
}

export async function GET(req: Request) {
	const { searchParams } = new URL(req.url);
	const workspaceId = searchParams.get("workspaceId");
	if (!workspaceId) return error("workspaceId is required", 400);
	const prisma = getPrismaClient();
	try {
		const channels = await prisma.channel.findMany({
			where: { workspaceId },
			orderBy: { createdAt: "asc" },
		});
		return json({ channels });
	} catch (e) {
		return error("Failed to list channels", 500, { message: (e as Error).message });
	}
}


