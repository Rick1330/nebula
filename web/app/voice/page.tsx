"use client";

import * as React from "react";
import { Room, RoomEvent, DisconnectReason, createLocalAudioTrack, LocalAudioTrack } from "livekit-client";

declare global {
	interface Window {
		__nebulaRoom?: Room;
		__nebulaLocalAudio?: LocalAudioTrack;
	}
}

export default function VoicePage() {
	const [status, setStatus] = React.useState<string>("idle");
	const [isConnecting, setIsConnecting] = React.useState(false);
	const roomRef = React.useRef<Room | null>(null);
	const localAudioRef = React.useRef<LocalAudioTrack | null>(null);
	const [isMuted, setIsMuted] = React.useState(false);

	async function cleanupExistingConnection() {
		if (!roomRef.current) return;
		roomRef.current.disconnect();
		roomRef.current = null;
		await new Promise(resolve => setTimeout(resolve, 100));
	}

	async function fetchVoiceToken(): Promise<{ url: string; token: string; room: string }>
	{
		const res = await fetch("/api/voice/token", { cache: "no-store" });
		if (!res.ok) {
			throw new Error(`Failed to get token: ${res.status}`);
		}
		return res.json();
	}

	function createRoomInstance(): Room {
		const instance = new Room({
			adaptiveStream: true,
			dynacast: true,
			stopLocalTrackOnUnpublish: true,
		});
		roomRef.current = instance;
		if (process.env.NODE_ENV === "development") {
			window.__nebulaRoom = instance;
		}
		return instance;
	}

	function attachRoomEventHandlers(roomInstance: Room, roomName: string) {
		roomInstance.on(RoomEvent.Connected, async () => {
			console.log("✅ Connected to room:", roomName);
			setStatus(`✅ Connected to ${roomName}`);
			setIsConnecting(false);
			try {
				await publishMicrophone(roomInstance);
			} catch (err) {
				console.warn("Mic publish skipped or failed:", err);
			}
		});

		roomInstance.on(RoomEvent.Disconnected, (reason?: DisconnectReason) => {
			console.log("❌ Room disconnected:", reason);
			setStatus(
				reason === DisconnectReason.CLIENT_INITIATED
					? "👋 Disconnected by user"
					: "⚠️ Connection lost - click Join to reconnect"
			);
			setIsConnecting(false);
			if (localAudioRef.current) {
				try {
					localAudioRef.current.stop();
				} finally {
					localAudioRef.current = null;
					setIsMuted(false);
				}
			}
		});

		roomInstance.on(RoomEvent.ConnectionStateChanged, (state) => {
			console.log("🔄 Connection state changed:", state);
			if (state === "disconnected") {
				setStatus("⚠️ Connection lost - click Join to reconnect");
				setIsConnecting(false);
			}
		});

		roomInstance.on(RoomEvent.SignalConnected, () => {
			console.log("📡 Signal connected successfully");
			setStatus("📡 Signal connected - establishing media...");
		});

		roomInstance.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
			console.log("🎵 Track subscribed:", track.kind, participant.identity);
		});

		roomInstance.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
			console.log("🎵 Track unsubscribed:", track.kind, participant.identity);
		});

		roomInstance.on(RoomEvent.ParticipantConnected, (participant) => {
			console.log("👤 Participant connected:", participant.identity);
		});

		roomInstance.on(RoomEvent.ParticipantDisconnected, (participant) => {
			console.log("👤 Participant disconnected:", participant.identity);
		});

		roomInstance.on(RoomEvent.MediaDevicesChanged, () => {
			console.log("🎤 Media devices changed");
		});

		roomInstance.on(RoomEvent.ActiveSpeakersChanged, (speakers) => {
			console.log("🔊 Active speakers:", speakers);
		});
	}

	async function connectRoom(roomInstance: Room, url: string, token: string) {
		await roomInstance.connect(url, token, {
			autoSubscribe: true,
			rtcConfig: {
				iceServers: [
					{ urls: "stun:stun.l.google.com:19302" },
					{ urls: "stun:stun1.l.google.com:19302" },
					{ urls: "stun:stun2.l.google.com:19302" },
				],
				iceCandidatePoolSize: 0,
				iceTransportPolicy: "all",
				bundlePolicy: "max-bundle",
				rtcpMuxPolicy: "require",
			},
		});
	}

	async function publishMicrophone(roomInstance: Room) {
		const mic = await createLocalAudioTrack();
		await roomInstance.localParticipant.publishTrack(mic);
		localAudioRef.current = mic;
		setIsMuted(false);
		if (process.env.NODE_ENV === "development") {
			window.__nebulaLocalAudio = mic;
		}
		console.log("🎤 Mic published");
	}

	async function join() {
		if (isConnecting || roomRef.current?.state === "connected") return;
		await cleanupExistingConnection();
		try {
			setIsConnecting(true);
			setStatus("fetching token");
			const { url, token, room } = await fetchVoiceToken();
			setStatus("connecting");
			const roomInstance = createRoomInstance();
			attachRoomEventHandlers(roomInstance, room);
			await connectRoom(roomInstance, url, token);
		} catch (e) {
			console.error("Join error:", e);
			setStatus(`error: ${(e as Error).message}`);
			setIsConnecting(false);
		}
	}

	function leave() {
		if (roomRef.current) {
			roomRef.current.disconnect();
			roomRef.current = null;
			setStatus("idle");
		}
	}

	async function toggleMute() {
		const track = localAudioRef.current;
		if (!track) return;
		try {
			if (track.isMuted) {
				await track.unmute();
				setIsMuted(false);
			} else {
				await track.mute();
				setIsMuted(true);
			}
		} catch (e) {
			console.warn("mute toggle failed", e);
		}
	}

	// Reuse cached room in dev; cleanup in prod
	React.useEffect(() => {
		if (process.env.NODE_ENV === "development" && window.__nebulaRoom) {
			roomRef.current = window.__nebulaRoom;
			localAudioRef.current = window.__nebulaLocalAudio ?? null;
			if (roomRef.current?.state === "connected") {
				setStatus("✅ Connected (HMR)");
				setIsConnecting(false);
			}
		}

		return () => {
			if (process.env.NODE_ENV === "production") {
				if (roomRef.current) {
					roomRef.current.disconnect();
				}
				if (localAudioRef.current) {
					try {
						localAudioRef.current.stop();
					} finally {
						localAudioRef.current = null;
					}
				}
			}
		};
	}, []);

	return (
		<div className="flex min-h-screen items-center justify-center p-8">
			<div className="rounded border p-6 space-y-4 w-full max-w-md">
				<h1 className="text-xl font-semibold">Voice Demo</h1>
				<p className="text-sm text-gray-500">Status: {status}</p>
				<div className="flex gap-2">
					<button
						onClick={join}
						disabled={isConnecting}
						className="border rounded px-4 py-2 disabled:opacity-50"
					>
						{isConnecting ? "Connecting..." : "Join"}
					</button>
					<button
						onClick={leave}
						disabled={!roomRef.current || isConnecting}
						className="border rounded px-4 py-2 disabled:opacity-50"
					>
						Leave
					</button>
					<button
						onClick={toggleMute}
						disabled={!roomRef.current || !localAudioRef.current}
						className="border rounded px-4 py-2 disabled:opacity-50"
					>
						{isMuted ? "Unmute" : "Mute"}
					</button>
				</div>
				{status.includes("error") && (
					<p className="text-xs text-red-500 mt-2">
						Check browser console for detailed error information
					</p>
				)}
			</div>
		</div>
	);
}
