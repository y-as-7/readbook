"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Book,
  Plus,
  LogOut,
  ChevronRight,
  BookOpen,
  Clock,
  Trash2,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { deleteCachedPdf } from "@/lib/pdfCache";

export default function LibraryPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pdfs, setPdfs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      fetchPdfs();
    }
  }, [status, router]);

  const fetchPdfs = async () => {
    try {
      const res = await fetch("/api/pdfs");
      const data = await res.json();
      setPdfs(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this book?")) return;
    try {
      const res = await fetch(`/api/pdfs?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await deleteCachedPdf(id);
        setPdfs(pdfs.filter((pdf) => pdf._id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
          className="w-12 h-12 border-4 border-blue-600/20 border-t-blue-600 rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-white p-4 md:p-12 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-indigo-600/5 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto relative z-10">
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <motion.h1
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-4xl md:text-5xl font-black tracking-tighter bg-clip-text text-transparent bg-gradient-to-b from-white to-neutral-500"
            >
              My Library
            </motion.h1>
            <p className="text-neutral-400 mt-2 font-medium">
              Curating your digital shelf, {session?.user?.name}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <Link href="/upload">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-2xl flex items-center gap-2 font-semibold transition-all shadow-lg shadow-blue-500/20"
              >
                <Plus className="w-5 h-5" />
                Upload PDF
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 px-4 py-3 rounded-2xl transition-all"
            >
              <LogOut className="w-5 h-5 text-neutral-400" />
            </motion.button>
          </div>
        </header>

        {pdfs.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-neutral-800 rounded-3xl"
          >
            <div className="w-20 h-20 bg-neutral-900 rounded-3xl flex items-center justify-center mb-6">
              <Book className="w-10 h-10 text-neutral-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No books found</h3>
            <p className="text-neutral-500 mb-8">
              Start your collection by uploading your first PDF
            </p>
            <Link href="/upload">
              <button className="text-blue-400 hover:text-blue-300 font-medium transition-colors">
                Upload a document →
              </button>
            </Link>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {pdfs.map((pdf, index) => (
                <motion.div
                  key={pdf._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -12 }}
                  className="group bg-neutral-900/50 border border-neutral-800/50 rounded-[32px] md:rounded-[40px] overflow-hidden hover:border-blue-500/30 transition-all duration-500 flex flex-col shadow-2xl backdrop-blur-sm"
                >
                  <div className="aspect-[3/4] bg-neutral-800 relative flex items-center justify-center overflow-hidden">
                    {pdf.coverImage ? (
                      <img
                        src={pdf.coverImage}
                        alt={pdf.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <BookOpen className="w-24 h-24 text-neutral-700 group-hover:text-blue-600/20 transition-colors" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-transparent to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 bg-blue-400/10 px-3 py-1.5 rounded-full w-fit backdrop-blur-md">
                        <Clock className="w-3 h-3" />
                        {pdf.progress}% READ
                      </div>
                    </div>
                  </div>
                  <div className="p-6 md:p-8 flex-1 flex flex-col">
                    <h3 className="font-bold text-lg md:text-xl mb-1 tracking-tight truncate">
                      {pdf.title}
                    </h3>
                    <p className="text-neutral-500 text-xs md:text-sm mb-6 md:mb-8 font-medium truncate">
                      {pdf.fileName}
                    </p>

                    <div className="mt-auto flex items-center justify-between gap-3">
                      <Link href={`/view/${pdf._id}`} className="flex-1">
                        <button className="w-full bg-neutral-800/50 hover:bg-blue-600 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 border border-neutral-700/50 hover:border-blue-500">
                          {pdf.progress > 0 ? "Resume" : "Start Reading"}
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(pdf._id)}
                        className="p-3.5 bg-neutral-800/50 hover:bg-red-500/10 hover:text-red-500 rounded-2xl transition-all border border-neutral-700/50"
                        title="Remove from library"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
