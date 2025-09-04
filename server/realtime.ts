import http from "http";
import { Server } from "socket.io";

export function createRealtimeServer(port = Number(process.env.WS_PORT ?? 4001)) {
	const httpServer = http.createServer();
	const io = new Server(httpServer, {
		cors: { origin: "*" },
	});

	io.on("connection", (socket) => {
		console.log(`[realtime] client connected ${socket.id}`);
		socket.on("ping", () => socket.emit("pong"));
		socket.on("disconnect", (reason) => console.log(`[realtime] client disconnected ${socket.id} ${reason}`));
	});

	httpServer.listen(port, () => {
		// eslint-disable-next-line no-console
		console.log(`[realtime] listening on :${port}`);
	});

	return { io, httpServer };
}

// Always start when run via ws:dev
createRealtimeServer();
