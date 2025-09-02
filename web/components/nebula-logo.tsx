"use client";

import { motion } from "framer-motion";

export function NebulaLogo() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 6 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ type: "spring", stiffness: 120, damping: 16 }}
			className="inline-flex items-center gap-2 select-none"
		>
			<span
				aria-hidden
				className="h-5 w-5 rounded-full bg-gradient-to-br from-fuchsia-500 via-violet-500 to-sky-500 shadow-md"
			/>
			<span className="text-lg font-semibold tracking-tight">Nebula</span>
		</motion.div>
	);
}
