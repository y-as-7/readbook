"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Moon,
  Sun,
  Layout,
  Gauge,
  Check,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [scrollLatency, setScrollLatency] = useState(1200);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchSettings();
    }
  }, [status, router]);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      const data = await res.json();
      if (res.ok) {
        setIsDarkMode(data.isDarkMode);
        setScrollLatency(data.scrollLatency || 1200);
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDarkMode, scrollLatency }),
      });
      if (res.ok) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        // Also update local storage as fallback
        localStorage.setItem("readbook_dark_mode", isDarkMode.toString());
        localStorage.setItem(
          "readbook_scroll_latency",
          scrollLatency.toString(),
        );
      }
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white font-sans selection:bg-blue-500/30">
      <header className="h-20 bg-neutral-950/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50">
        <div className="flex items-center gap-6">
          <Link href="/library">
            <button className="p-3 hover:bg-neutral-900 rounded-2xl transition-all group border border-white/5 active:scale-95">
              <ArrowLeft className="w-5 h-5 text-neutral-400 group-hover:text-white" />
            </button>
          </Link>
          <h1 className="text-2xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">
            Settings
          </h1>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white px-6 py-3 rounded-2xl font-bold transition-all active:scale-95 shadow-lg shadow-blue-500/20"
        >
          {saving ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{saving ? "Saving..." : "Save Changes"}</span>
        </button>
      </header>

      <main className="max-w-3xl mx-auto py-12 px-6">
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl flex items-center gap-3 text-emerald-400"
            >
              <Check className="w-5 h-5" />
              <p className="font-bold">Settings saved successfully!</p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="space-y-8">
          {/* Appearance Section */}
          <section className="bg-neutral-950/50 border border-white/5 p-8 rounded-[32px] shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <Layout className="w-5 h-5 text-blue-500" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-neutral-200">
                Appearance
              </h2>
            </div>

            <div className="flex items-center justify-between p-6 bg-neutral-900/50 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
              <div>
                <p className="font-bold text-lg mb-1">Dark Mode</p>
                <p className="text-sm text-neutral-500">
                  Toggle between light and dark themes
                </p>
              </div>
              <button
                onClick={() => setIsDarkMode(!isDarkMode)}
                className={`w-14 h-8 rounded-full transition-all relative ${
                  isDarkMode ? "bg-blue-600" : "bg-neutral-800"
                }`}
              >
                <motion.div
                  animate={{ x: isDarkMode ? 24 : 4 }}
                  className="w-6 h-6 bg-white rounded-full absolute top-1 shadow-lg flex items-center justify-center"
                >
                  {isDarkMode ? (
                    <Moon className="w-3 h-3 text-blue-600" />
                  ) : (
                    <Sun className="w-3 h-3 text-neutral-400" />
                  )}
                </motion.div>
              </button>
            </div>
          </section>

          {/* PDF Performance Section */}
          <section className="bg-neutral-950/50 border border-white/5 p-8 rounded-[32px] shadow-2xl">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <Gauge className="w-5 h-5 text-purple-500" />
              </div>
              <h2 className="text-xl font-black tracking-tight text-neutral-200">
                Reader Performance
              </h2>
            </div>

            <div className="space-y-6">
              <div className="p-6 bg-neutral-900/50 rounded-2xl border border-white/5 group hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="font-bold text-lg mb-1">
                      Scroll Latency (Pre-rendering)
                    </p>
                    <p className="text-sm text-neutral-500">
                      How many pixels ahead to pre-render PDF pages while
                      scrolling
                    </p>
                  </div>
                  <span className="text-xl font-black text-blue-500 bg-blue-500/10 px-4 py-2 rounded-xl">
                    {scrollLatency}px
                  </span>
                </div>

                <input
                  type="range"
                  min="0"
                  max="4000"
                  step="200"
                  value={scrollLatency}
                  onChange={(e) => setScrollLatency(parseInt(e.target.value))}
                  className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-600"
                />
                <div className="flex justify-between mt-4 text-[10px] uppercase tracking-widest font-black text-neutral-600">
                  <span>Fast (Lower RAM)</span>
                  <span>Smooth (Higher RAM)</span>
                </div>
              </div>

              <div className="bg-blue-500/5 border border-blue-500/10 p-4 rounded-2xl">
                <p className="text-xs text-blue-400 leading-relaxed">
                  <span className="font-black uppercase mr-2">Tip:</span>
                  Higher latency values provide a smoother scrolling experience
                  but use more system memory. Reduce this if you experience slow
                  performance on large documents.
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
