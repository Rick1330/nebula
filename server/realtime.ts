import http from "http";
import { Server } from "socket.io";
import { validateEvent } from "./ws/schemas";
import { PresenceService } from "./presence";

type ServerToClientEvents = {
	pong: () => void;
};

type ClientToServerEvents = {
	ping: () => void;
};

export function createRealtimeServer(port = Number(process.env.WS_PORT ?? 4001)) {
	const redisUrl = process.env.REDIS_URL;
	let presence: PresenceService = new PresenceService();

	// Create HTTP server with async presence snapshot handling
	const httpServer = http.createServer((req, res) => {
		if (req.method === "GET" && req.url === "/presence") {
			void (async () => {
				try {
					const body = JSON.stringify(await presence.snapshot());
					res.statusCode = 200;
					res.setHeader("content-type", "application/json");
					res.end(body);
				} catch (err) {
					res.statusCode = 500;
					res.setHeader("content-type", "application/json");
					res.end(JSON.stringify({ error: (err as Error).message }));
				}
			})();
			return;
		}
		res.statusCode = 200;
		res.setHeader("content-type", "text/plain");
		res.end("ok\n");
	});
	const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
		cors: { origin: "*" },
	});

	// Optional Redis adapter for scale-out and presence
	if (redisUrl) {
		(async () => {
			try {
				const { createAdapter } = await import("@socket.io/redis-adapter");
				const Redis = (await import("ioredis")).default;
				const pub = new Redis(redisUrl);
				const sub = new Redis(redisUrl);
				const presenceClient = new Redis(redisUrl);
				presence = new PresenceService({ redis: presenceClient });
				io.adapter(createAdapter(pub, sub));
				console.log(`[realtime] redis adapter enabled (${redisUrl})`);
			} catch (err) {
				console.warn(`[realtime] redis adapter unavailable: ${(err as Error).message}`);
				presence = new PresenceService();
			}
		})();
	}

	// Connection-level logging
	io.on("connection", (socket) => {
		void presence.onConnect(socket.id);
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

		// Event middleware: rate limit + validation + logging
		socket.use((packet, next) => {
			const [eventName, ...args] = packet as [string, ...unknown[]];
			if (!allow(eventName)) {
				console.warn(JSON.stringify({ level: "warn", msg: "ws_rate_limited", socketId: socket.id, event: eventName }));
				return next(new Error("rate_limited"));
			}
			const v = validateEvent(eventName, args);
			if (!v.ok) {
				console.warn(JSON.stringify({ level: "warn", msg: "ws_invalid_event", socketId: socket.id, event: eventName, error: v.error }));
				return next(new Error("invalid_event"));
			}
			console.log(JSON.stringify({ level: "info", msg: "ws_event", socketId: socket.id, event: eventName }));
			return next();
		});

		socket.on("ping", () => {
			void presence.heartbeat(socket.id);
			socket.emit("pong");
		});
		socket.on("disconnect", (reason) => {
			void presence.onDisconnect(socket.id);
			console.log(JSON.stringify({ level: "info", msg: "ws_disconnect", socketId: socket.id, reason }));
		});
	});

	httpServer.listen(port, () => {
		// eslint-disable-next-line no-console
		console.log(`[realtime] listening on :${port}`);
	});

	return { io, httpServer };
}

// Always start when run via ws:dev
createRealtimeServer();
