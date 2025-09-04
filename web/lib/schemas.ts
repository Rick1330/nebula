import { z } from "zod";

export const createWorkspaceSchema = z.object({
	name: z.string().min(2).max(64),
});

export const createChannelSchema = z.object({
	workspaceId: z.string().min(1),
	name: z.string().min(2).max(64),
	type: z.enum(["TEXT", "VOICE"]).default("TEXT"),
});

export const updateChannelSchema = z.object({
	name: z.string().min(2).max(64),
});

export type CreateWorkspaceInput = z.infer<typeof createWorkspaceSchema>;
export type CreateChannelInput = z.infer<typeof createChannelSchema>;
export type UpdateChannelInput = z.infer<typeof updateChannelSchema>;

