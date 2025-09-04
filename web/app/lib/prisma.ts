import { PrismaClient } from "@prisma/client";

declare global {
	// eslint-disable-next-line no-var
	var __prismaClient: PrismaClient | undefined;
}

export function getPrismaClient(): PrismaClient {
	if (!global.__prismaClient) {
		global.__prismaClient = new PrismaClient();
	}
	return global.__prismaClient;
}
