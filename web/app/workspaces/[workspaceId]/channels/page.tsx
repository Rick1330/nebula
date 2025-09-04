"use client";

import * as React from "react";

async function fetchChannels(workspaceId: string) {
	const res = await fetch(`/api/channels?workspaceId=${encodeURIComponent(workspaceId)}`, { cache: "no-store" });
	if (!res.ok) throw new Error(`Failed to fetch channels (${res.status})`);
	return (await res.json()).channels as Array<{ id: string; name: string; type: string }>;
}

async function createChannel(input: { workspaceId: string; name: string; type: "TEXT" | "VOICE" }) {
	const res = await fetch(`/api/channels`, {
		method: "POST",
		headers: { "content-type": "application/json" },
		body: JSON.stringify(input),
	});
	if (!res.ok) throw new Error(`Failed to create channel (${res.status})`);
	return (await res.json()).channel as { id: string; name: string; type: string };
}

async function deleteChannel(id: string) {
	const res = await fetch(`/api/channels/${encodeURIComponent(id)}`, { method: "DELETE" });
	if (!res.ok) throw new Error(`Failed to delete channel (${res.status})`);
}

async function renameChannel(id: string, name: string) {
	const res = await fetch(`/api/channels/${encodeURIComponent(id)}`, {
		method: "PATCH",
		headers: { "content-type": "application/json" },
		body: JSON.stringify({ name }),
	});
	if (!res.ok) throw new Error(`Failed to rename channel (${res.status})`);
	return (await res.json()).channel as { id: string; name: string; type: string };
}

export default function ChannelsPage({ params }: { params: { workspaceId: string } }) {
	const { workspaceId } = params;
	const [channels, setChannels] = React.useState<Array<{ id: string; name: string; type: string }>>([]);
	const [name, setName] = React.useState("");
	const [type, setType] = React.useState<"TEXT" | "VOICE">("TEXT");
	const [error, setError] = React.useState<string | null>(null);
	const [loading, setLoading] = React.useState<boolean>(true);
	const [renamingId, setRenamingId] = React.useState<string | null>(null);
	const [renameValue, setRenameValue] = React.useState<string>("");

	const load = React.useCallback(async () => {
		try {
			setLoading(true);
			const data = await fetchChannels(workspaceId);
			setChannels(data);
			setError(null);
		} catch (e) {
			setError((e as Error).message);
		} finally {
			setLoading(false);
		}
	}, [workspaceId]);

	React.useEffect(() => {
		void load();
	}, [load]);

	async function onSubmit(e: React.FormEvent) {
		e.preventDefault();
		try {
			const created = await createChannel({ workspaceId, name, type });
			setChannels((prev) => [...prev, created]);
			setName("");
			setType("TEXT");
			setError(null);
		} catch (e) {
			setError((e as Error).message);
		}
	}

	async function onDelete(id: string) {
		try {
			await deleteChannel(id);
			setChannels((prev) => prev.filter((c) => c.id !== id));
		} catch (e) {
			setError((e as Error).message);
		}
	}

	function startRename(c: { id: string; name: string }) {
		setRenamingId(c.id);
		setRenameValue(c.name);
	}

	async function submitRename(e: React.FormEvent) {
		e.preventDefault();
		if (!renamingId) return;
		const id = renamingId;
		const newName = renameValue.trim();
		if (newName.length < 2) return;
		try {
			// optimistic update
			setChannels((prev) => prev.map((c) => (c.id === id ? { ...c, name: newName } : c)));
			await renameChannel(id, newName);
			setRenamingId(null);
			setRenameValue("");
			setError(null);
		} catch (e) {
			setError((e as Error).message);
			// reload from server on failure
			void load();
		}
	}

	return (
		<div className="max-w-2xl mx-auto p-6 space-y-6">
			<h1 className="text-2xl font-semibold">Channels</h1>
			<form onSubmit={onSubmit} className="flex gap-2 items-end">
				<div className="flex-1">
					<label className="block text-sm font-medium">Name</label>
					<input value={name} onChange={(e) => setName(e.target.value)} className="w-full border rounded px-3 py-2" placeholder="# general" required minLength={2} maxLength={64} />
				</div>
				<div>
					<label className="block text-sm font-medium">Type</label>
					<select value={type} onChange={(e) => setType(e.target.value as "TEXT" | "VOICE")} className="border rounded px-3 py-2">
						<option value="TEXT">TEXT</option>
						<option value="VOICE">VOICE</option>
					</select>
				</div>
				<button type="submit" className="border rounded px-4 py-2">Create</button>
			</form>
			{loading ? <p>Loading…</p> : null}
			{error ? <p className="text-red-600 text-sm">{error}</p> : null}
			<ul className="divide-y">
				{channels.map((c) => (
					<li key={c.id} className="py-2 flex items-center justify-between gap-4">
						<div className="flex-1">
							{renamingId === c.id ? (
								<form onSubmit={submitRename} className="flex gap-2">
									<input className="border rounded px-2 py-1 flex-1" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} minLength={2} maxLength={64} />
									<button type="submit" className="text-sm">Save</button>
									<button type="button" onClick={() => setRenamingId(null)} className="text-sm text-gray-600">Cancel</button>
								</form>
							) : (
								<>
									<p className="font-medium">{c.name}</p>
									<p className="text-xs text-gray-500">{c.type}</p>
								</>
							)}
						</div>
						<div className="flex items-center gap-3">
							{renamingId !== c.id ? (
								<button onClick={() => startRename(c)} className="text-sm">Rename</button>
							) : null}
							<button onClick={() => onDelete(c.id)} className="text-red-600 text-sm">Delete</button>
						</div>
					</li>
				))}
			</ul>
		</div>
	);
}
