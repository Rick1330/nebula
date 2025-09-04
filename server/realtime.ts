import http from "http";
import { Server } from "socket.io";

type ServerToClientEvents = {
	pong: () => void;
};

type ClientToServerEvents = {
	ping: () => void;
};

export function createRealtimeServer(port = Number(process.env.WS_PORT ?? 4001)) {
	const httpServer = http.createServer();
	const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
		cors: { origin: "*" },
	});

	// Optional Redis adapter for scale-out
	const redisUrl = process.env.REDIS_URL;
	if (redisUrl) {
		(async () => {
			try {
				const { createAdapter } = await import("@socket.io/redis-adapter");
				const Redis = (await import("ioredis")).default;
				const pub = new Redis(redisUrl);
				const sub = new Redis(redisUrl);
				io.adapter(createAdapter(pub, sub));
				console.log(`[realtime] redis adapter enabled (${redisUrl})`);
			} catch (err) {
				console.warn(`[realtime] redis adapter unavailable: ${(err as Error).message}`);
			}
		})();
	}

	// Connection-level logging
	io.on("connection", (socket) => {
		console.log(JSON.stringify({ level: "info", msg: "ws_connect", socketId: socket.id }));

		// Per-socket per-event token bucket
		const ratePerSec = Number(process.env.WS_RATE_EVENTS_PER_SEC ?? 10);
		const burst = Number(process.env.WS_RATE_BURST ?? 20);
		const buckets = new Map<string, { tokens: number; lastRefillMs: number }>();

		function allow(eventName: string): boolean {
			const now = Date.now();
			let bucket = buckets.get(eventName);
			if (!bucket) {
				bucket = { tokens: burst, lastRefillMs: now };
				buckets.set(eventName, bucket);
			}
			// Refill tokens based on elapsed time
			const elapsedMs = now - bucket.lastRefillMs;
			const refill = (elapsedMs / 1000) * ratePerSec;
			bucket.tokens = Math.min(burst, bucket.tokens + refill);
			bucket.lastRefillMs = now;
			if (bucket.tokens >= 1) {
				bucket.tokens -= 1;
				return true;
			}
			return false;
		}

		// Event middleware for rate limit + logging
		socket.use((packet, next) => {
			const [eventName] = packet as [string, ...unknown[]];
			if (!allow(eventName)) {
				console.warn(JSON.stringify({ level: "warn", msg: "ws_rate_limited", socketId: socket.id, event: eventName }));
				return next(new Error("rate_limited"));
			}
			console.log(JSON.stringify({ level: "info", msg: "ws_event", socketId: socket.id, event: eventName }));
			return next();
		});

		socket.on("ping", () => socket.emit("pong"));
		socket.on("disconnect", (reason) => console.log(JSON.stringify({ level: "info", msg: "ws_disconnect", socketId: socket.id, reason })));
	});

	httpServer.listen(port, () => {
		// eslint-disable-next-line no-console
		console.log(`[realtime] listening on :${port}`);
	});

	return { io, httpServer };
}

// Always start when run via ws:dev
createRealtimeServer();
