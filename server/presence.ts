import type { Redis } from "ioredis";

const DEFAULT_TTL_SECONDS = 30;

export class PresenceService {
	private onlineSocketIds: Set<string> = new Set();
	private redis?: Redis;
	private keyPrefix: string;
	private ttlSeconds: number;
	private instanceId: string;

	constructor(opts?: { redis?: Redis; keyPrefix?: string; ttlSeconds?: number; instanceId?: string }) {
		this.redis = opts?.redis;
		this.keyPrefix = opts?.keyPrefix ?? "nebula:presence";
		this.ttlSeconds = opts?.ttlSeconds ?? DEFAULT_TTL_SECONDS;
		this.instanceId = opts?.instanceId ?? `${process.pid}`;
	}

	public async onConnect(socketId: string) {
		this.onlineSocketIds.add(socketId);
		if (this.redis) {
			await this.redis.setex(this.socketKey(socketId), this.ttlSeconds, this.instanceId);
			await this.redis.incr(this.countKey());
		}
	}

	public async onDisconnect(socketId: string) {
		this.onlineSocketIds.delete(socketId);
		if (this.redis) {
			await this.redis.del(this.socketKey(socketId));
			await this.redis.decr(this.countKey());
		}
	}

	public async heartbeat(socketId: string) {
		if (this.redis) {
			await this.redis.setex(this.socketKey(socketId), this.ttlSeconds, this.instanceId);
		}
	}

	public async snapshot() {
		if (this.redis) {
			// Fallback to counter; in case of skew, recalc by keys length
			const cnt = await this.redis.get(this.countKey());
			const online = cnt ? Number(cnt) : await this.countByScan();
			return { online };
		}
		return { online: this.onlineSocketIds.size };
	}

	private async countByScan(): Promise<number> {
		if (!this.redis) return this.onlineSocketIds.size;
		let cursor = "0";
		let total = 0;
		do {
			// SCAN pattern: keyPrefix:sockets:*
			const [next, keys] = await this.redis.scan(cursor, "MATCH", `${this.keyPrefix}:sockets:*`, "COUNT", 100);
			cursor = next;
			total += keys.length;
		} while (cursor !== "0");
		return total;
	}

	private socketKey(socketId: string) {
		return `${this.keyPrefix}:sockets:${socketId}`;
	}

	private countKey() {
		return `${this.keyPrefix}:count`;
	}
}
