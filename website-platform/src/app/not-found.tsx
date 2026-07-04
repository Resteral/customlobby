"use client";

import Link from "next/link";
import { Bot, Home, Swords, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#070a13] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(99,102,241,0.02)_1px,transparent_1px),linear-gradient(to_right,rgba(99,102,241,0.02)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none -z-10" />

      <div className="max-w-md w-full text-center space-y-8">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-rose-500/5"
        >
          <Bot className="w-10 h-10 animate-bounce" />
        </motion.div>

        <div className="space-y-3">
          <h1 className="text-8xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-white/30">
            404
          </h1>
          <h2 className="text-2xl font-bold tracking-tight">Lobby Not Found</h2>
          <p className="text-gray-400 text-sm leading-relaxed max-w-xs mx-auto">
            The page you&apos;re searching for has been disconnected or relocated to another server.
          </p>
        </div>

        <div className="grid gap-3 pt-4">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-white py-3.5 rounded-xl font-semibold shadow-lg shadow-primary/15 transition-all text-sm"
          >
            <Home className="w-4 h-4" />
            Back to Home
          </Link>
          <Link
            href="/marketplace/arcade"
            className="flex items-center justify-center gap-2 bg-[#131a2e] hover:bg-[#19223c] border border-border/40 text-gray-300 py-3.5 rounded-xl font-semibold transition-all text-sm group"
          >
            <Swords className="w-4 h-4 text-amber-500" />
            Play Tug Arcade Instead
            <ArrowRight className="w-4 h-4 opacity-70 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </div>
  );
}
