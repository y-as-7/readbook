"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { BookOpen, ArrowRight, Shield, Zap, Library } from "lucide-react";
import { motion } from "framer-motion";

export default function Home() {
  const { status } = useSession();

  return (
    <div className="min-h-screen bg-neutral-950 text-white overflow-hidden selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-neutral-950/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2 transition-transform hover:scale-105 cursor-pointer">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight">ReadBook</span>
          </div>
          <div className="flex items-center gap-4">
            {status === "authenticated" ? (
              <Link
                href="/library"
                className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-500 transition-all shadow-xl shadow-blue-500/20"
              >
                Go to Library
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-5 py-2.5 text-neutral-400 hover:text-white font-medium transition-colors"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  className="px-4 md:px-6 py-2.5 bg-white text-black rounded-full font-bold hover:bg-neutral-200 transition-all shadow-xl shadow-white/10 text-sm md:text-base"
                >
                  Get Started
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] -z-10" />

            <span className="inline-block px-4 py-1.5 rounded-full border border-blue-500/20 bg-blue-500/5 text-blue-400 text-sm font-semibold mb-8 animate-pulse">
              ✨ Experience the future of reading
            </span>

            <h1 className="text-5xl md:text-9xl font-black tracking-tighter mb-10 leading-[0.9] md:leading-[0.8] drop-shadow-2xl">
              Your Personal <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-b from-blue-400 via-indigo-500 to-indigo-700">
                Digital Library
              </span>
            </h1>

            <p className="text-xl md:text-2xl text-neutral-400 max-w-2xl mb-14 leading-relaxed font-light">
              Elevate your reading experience. Upload, track, and curate your
              collection in a space designed for focus.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
              {status === "authenticated" ? (
                <Link href="/library">
                  <button className="px-10 py-5 bg-blue-600 rounded-2xl text-lg font-bold hover:bg-blue-500 transition-all flex items-center gap-2 group shadow-2xl shadow-blue-500/30">
                    Go to My Library
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                </Link>
              ) : (
                <>
                  <Link href="/register">
                    <button className="px-8 md:px-10 py-4 md:py-5 bg-blue-600 rounded-2xl text-base md:text-lg font-bold hover:bg-blue-500 transition-all flex items-center gap-2 group shadow-2xl shadow-blue-500/30">
                      Get Started
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <Link href="/login">
                    <button className="px-8 md:px-10 py-4 md:py-5 bg-neutral-900 border border-neutral-800 rounded-2xl text-base md:text-lg font-bold hover:bg-neutral-800 transition-all">
                      Sign In
                    </button>
                  </Link>
                </>
              )}
            </div>
          </motion.div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-48 w-full">
            {[
              {
                icon: Shield,
                title: "Encrypted Cloud",
                desc: "Your literature is safe, private, and accessible from anywhere.",
              },
              {
                icon: Zap,
                title: "Instant Viewer",
                desc: "Zero lag. Zero distraction. Pure focus on what matters most.",
              },
              {
                icon: Library,
                title: "Smart Sync",
                desc: "Pick up exactly where you left off on any device, any time.",
              },
            ].map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 md:p-12 bg-neutral-900/40 border border-neutral-800/50 rounded-[40px] text-left hover:border-blue-500/20 transition-all duration-500 group backdrop-blur-sm"
              >
                <div className="w-16 h-16 bg-neutral-950 border border-neutral-800/50 rounded-2xl flex items-center justify-center mb-8 group-hover:bg-blue-600 transition-all duration-500 group-hover:shadow-lg group-hover:shadow-blue-500/20">
                  <f.icon className="w-8 h-8 text-blue-500 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl md:text-2xl font-bold mb-4 tracking-tight">
                  {f.title}
                </h3>
                <p className="text-neutral-500 leading-relaxed font-medium text-sm md:text-base">
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </main>

      <footer className="py-20 border-t border-neutral-900">
        <div className="max-w-7xl mx-auto px-6 text-center text-neutral-600 text-sm">
          &copy; {new Date().getFullYear()} ReadBook. Built with Next.js and
          MongoDB.
        </div>
      </footer>
    </div>
  );
}
