import { getPrismaClient } from "@/app/lib/prisma";
import { json, error } from "@/lib/api";
import { createWorkspaceSchema } from "@/lib/schemas";

export async function POST(req: Request) {
	try {
		const body = await req.json().catch(() => null);
		const parsed = createWorkspaceSchema.safeParse(body);
		if (!parsed.success) return error("Invalid payload", 400, { issues: parsed.error.flatten() });
		const prisma = getPrismaClient();
		const workspace = await prisma.workspace.create({ data: { name: parsed.data.name } });
		return json({ workspace });
	} catch (e: any) {
		return error("Internal error", 500, { message: e?.message });
	}
}
