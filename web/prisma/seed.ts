import { getPrismaClient } from "@/app/lib/prisma";

async function main() {
	const prisma = getPrismaClient();

	const user = await prisma.user.upsert({
		where: { email: "founder@example.com" },
		update: {},
		create: { email: "founder@example.com", name: "Founder" },
	});

	const workspace = await prisma.workspace.create({
		data: { name: "Nebula HQ" },
	});

	await prisma.workspaceMember.create({
		data: { userId: user.id, workspaceId: workspace.id, role: "owner" },
	});

	const channel = await prisma.channel.create({
		data: { name: "general", workspaceId: workspace.id, type: "TEXT" },
	});

	await prisma.message.create({
		data: { channelId: channel.id, userId: user.id, content: "Hello, Nebula!" },
	});

	console.log("Seed complete:", { user: user.email, workspace: workspace.name, channel: channel.name });
}

main().catch((err) => {
	console.error(err);
	process.exit(1);
});
