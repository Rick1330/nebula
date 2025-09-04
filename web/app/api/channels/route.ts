import { getPrismaClient } from "@/app/lib/prisma";
import { json, error } from "@/lib/api";
import { createChannelSchema } from "@/lib/schemas";

export async function POST(req: Request) {
	const body = await req.json().catch(() => null);
	const parsed = createChannelSchema.safeParse(body);
	if (!parsed.success) return error("Invalid payload", 400, { issues: parsed.error.flatten() });
	const prisma = getPrismaClient();
	const channel = await prisma.channel.create({
		data: {
			name: parsed.data.name,
			workspaceId: parsed.data.workspaceId,
			type: parsed.data.type,
		},
	});
	return json({ channel });
}


