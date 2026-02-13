"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Save,
  Maximize2,
  Minimize2,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun,
  Languages,
  Copy,
  Check,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import dynamic from "next/dynamic";
import { getCachedPdf, cachePdf } from "@/lib/pdfCache";

const PDFReader = dynamic(() => import("@/components/PDFReader"), {
  ssr: false,
  loading: () => (
    <div className="flex flex-col items-center gap-4 py-20">
      <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
      <p className="text-neutral-400 font-medium text-center">
        Initialising reader...
      </p>
    </div>
  ),
});

export default function ViewerPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pdf, setPdf] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Translation State
  const [selectedText, setSelectedText] = useState("");
  const [translationPos, setTranslationPos] = useState({ x: 0, y: 0 });
  const [showTranslateBtn, setShowTranslateBtn] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Reading Marker State
  const [markerPos, setMarkerPos] = useState<{ x: number; y: number } | null>(
    null,
  );

  // 1. Initialize dark mode from server on mount
  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/user/settings");
      const data = await res.json();
      if (res.ok) {
        setIsDarkMode(data.isDarkMode);
      } else {
        // Fallback to localStorage if server fails
        const saved = localStorage.getItem("readbook_dark_mode");
        if (saved !== null) {
          setIsDarkMode(saved === "true");
        }
      }
    } catch (err) {
      console.error("Failed to fetch settings", err);
    }
  };

  // 2. Persist dark mode to server AND localStorage when it changes
  useEffect(() => {
    localStorage.setItem("readbook_dark_mode", isDarkMode.toString());
    saveSettings();
  }, [isDarkMode]);

  const saveSettings = async () => {
    try {
      await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDarkMode }),
      });
    } catch (err) {
      console.error("Failed to save settings", err);
    }
  };

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated" && id) {
      fetchPdf();
    }
  }, [status, id, router]);

  const fetchPdf = async () => {
    try {
      // 1. Try to load from cache first for instant UI
      const cached = await getCachedPdf(id as string);
      if (cached) {
        setPdf(cached);
        setLoading(false);
      }

      // 2. Fetch from server anyway to get latest progress and potential updates
      const res = await fetch(`/api/pdfs/progress?id=${id}`);
      const data = await res.json();

      if (res.ok) {
        setPdf(data);
        // 3. Update cache with latest data
        await cachePdf(id as string, data);
      } else if (!cached) {
        // Only redirect if we don't even have a cached version
        router.push("/library");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    // Restore scroll position after a short delay to ensure content is rendered
    setTimeout(() => {
      if (scrollRef.current && pdf?.scrollY) {
        scrollRef.current.scrollTop = pdf.scrollY;
      }
    }, 1000);
  }

  const handleScroll = () => {
    if (!scrollRef.current) return;

    // Clear selection, marker and translation UI on scroll
    if ((showTranslateBtn || markerPos) && !isTranslating) {
      setShowTranslateBtn(false);
      setMarkerPos(null);
      window.getSelection()?.removeAllRanges();
    }

    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight <= clientHeight) return;
    const currentProgress = Math.round(
      (scrollTop / (scrollHeight - clientHeight)) * 100,
    );
    setProgress(currentProgress);
  };

  // Auto-save every 10 seconds if changed
  useEffect(() => {
    const interval = setInterval(() => {
      if (progress > 0) saveProgress();
    }, 10000);
    return () => clearInterval(interval);
  }, [progress]);

  const saveProgress = async () => {
    if (!pdf || !scrollRef.current) return;
    setSaving(true);
    try {
      await fetch("/api/pdfs/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pdfId: id,
          progress: progress,
          scrollY: scrollRef.current.scrollTop,
        }),
      });
    } catch (err) {
      console.error("Failed to save progress", err);
    } finally {
      setTimeout(() => setSaving(false), 1000);
    }
  };

  const handleSelection = (e: React.MouseEvent, isDoubleClick = false) => {
    // Increase timeout for double-click to ensure browser native selection completes
    const timeout = isDoubleClick ? 150 : 50;

    setTimeout(() => {
      const selection = window.getSelection();
      if (!selection || selection.rangeCount === 0) return;

      if (isDoubleClick) {
        try {
          // Force expansion to word boundaries
          // We use a robust sequence: move to word start, then extend to word end
          const sel = selection as any;
          if (sel.modify) {
            // First, extend to capture the whole word we are in
            // This handles cases where the native double-click missed a fragmented character
            sel.modify("extend", "backward", "word");
            sel.collapseToStart();
            sel.modify("extend", "forward", "word");
          }
        } catch (err) {
          console.warn("Selection expansion failed", err);
        }
      }

      const text = selection.toString().trim();

      if (text && text.length > 0) {
        setSelectedText(text);
        setTranslationPos({ x: e.clientX, y: e.clientY });
        setShowTranslateBtn(true);
        setMarkerPos(null); // Hide marker if selecting text
        setTranslatedText(""); // Reset previous translation
      } else if (!isTranslating) {
        setShowTranslateBtn(false);
        // If it's a simple click (no selection), show the reading marker
        if (!isDoubleClick) {
          setMarkerPos({ x: e.clientX, y: e.clientY });
        }
      }
    }, timeout);
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    // If it's a double click or more, let handleDoubleClick handle it
    if (e.detail >= 2) return;
    handleSelection(e, false);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    handleSelection(e, true);
  };

  const handleTranslate = async () => {
    if (!selectedText) return;
    setIsTranslating(true);
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(selectedText)}&langpair=en|ar`,
      );
      const data = await res.json();
      if (data.responseData) {
        setTranslatedText(data.responseData.translatedText);
      }
    } catch (err) {
      console.error("Translation error:", err);
    } finally {
      setIsTranslating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(translatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen bg-neutral-900 flex flex-col overflow-hidden text-white">
      <header className="h-16 md:h-20 bg-neutral-950/80 backdrop-blur-2xl border-b border-white/5 flex items-center justify-between px-4 md:px-12 z-50 sticky top-0 shadow-2xl">
        <div className="flex items-center gap-3 md:gap-8">
          <Link href="/library">
            <button className="p-2 md:p-3 hover:bg-neutral-900 rounded-xl md:rounded-2xl transition-all group border border-white/5 active:scale-95 shadow-lg">
              <ArrowLeft className="w-4 h-4 md:w-5 md:h-5 text-neutral-400 group-hover:text-white transition-colors" />
            </button>
          </Link>
          <div className="hidden sm:block">
            <h1 className="font-black text-sm md:text-xl tracking-tighter truncate max-w-[120px] md:max-w-md bg-clip-text text-transparent bg-gradient-to-r from-white to-neutral-500">
              {pdf?.title}
            </h1>
            <p className="text-[8px] md:text-[10px] uppercase tracking-[0.2em] font-bold text-neutral-600 mt-0.5 md:mt-1">
              {numPages} Pages
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-8">
          <div className="flex items-center gap-2 md:gap-4 bg-neutral-900/50 border border-white/5 px-3 md:px-5 py-2 md:py-3 rounded-xl md:rounded-2xl shadow-inner group transition-all hover:border-blue-500/30">
            <div className="w-12 md:w-24 h-1 md:h-1.5 bg-neutral-800 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                className="h-full bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.5)]"
              />
            </div>
            <span className="text-[10px] md:text-xs font-black tracking-widest text-blue-500 group-hover:text-blue-400">
              {progress}%
            </span>
          </div>

          <button
            onClick={() => setIsDarkMode(!isDarkMode)}
            className={`p-2.5 md:p-3.5 rounded-xl md:rounded-2xl transition-all flex items-center gap-2 border active:scale-95 shadow-xl ${
              isDarkMode
                ? "bg-white text-black border-white"
                : "bg-neutral-900 text-neutral-400 border-white/5 hover:text-white"
            }`}
            title={isDarkMode ? "Light Mode" : "Dark Mode"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 md:w-5 md:h-5" />
            ) : (
              <Moon className="w-4 h-4 md:w-5 md:h-5" />
            )}
          </button>

          <div className="hidden xs:flex items-center gap-2 text-neutral-500 text-[10px] md:text-xs">
            {saving ? (
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin" />
                <span className="hidden md:inline">Saving...</span>
              </span>
            ) : (
              <span className="flex items-center gap-1">
                <Save className="w-3 h-3" />
                <span className="hidden md:inline">Saved</span>
              </span>
            )}
          </div>
        </div>
      </header>

      {/* PDF Container */}
      {/* PDF Container */}
      <main
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        className="flex-1 overflow-hidden relative flex justify-center bg-neutral-900 text-black"
      >
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="w-full max-w-5xl h-full overflow-y-auto px-3 md:px-8 pt-6 md:pt-8 pb-32 scrollbar-thin scrollbar-thumb-neutral-700"
        >
          <div
            className={`flex flex-col items-center gap-0 pb-20 transition-all duration-500 ${isDarkMode ? "invert hue-rotate-180" : ""}`}
          >
            <PDFReader
              pdfContent={pdf?.content}
              numPages={numPages}
              onDocumentLoadSuccess={onDocumentLoadSuccess}
              isDarkMode={isDarkMode}
            />
          </div>
        </div>

        {/* Floating Translation UI */}
        <AnimatePresence>
          {showTranslateBtn && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 10 }}
              style={{
                position: "fixed",
                left: Math.min(
                  window.innerWidth - 300,
                  Math.max(20, translationPos.x - 150),
                ),
                top: Math.max(100, translationPos.y - 120),
              }}
              className="z-[100] flex flex-col items-center gap-3 pointer-events-none"
            >
              {!translatedText && !isTranslating && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTranslate();
                  }}
                  className="pointer-events-auto flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-2xl font-bold shadow-2xl hover:bg-blue-500 transition-all active:scale-95 border border-white/10"
                >
                  <Languages className="w-4 h-4" />
                  Translate to Arabic
                </button>
              )}

              {isTranslating && (
                <div className="bg-neutral-950/90 backdrop-blur-xl border border-white/10 px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3">
                  <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                  <span className="text-sm font-bold text-neutral-300">
                    Translating...
                  </span>
                </div>
              )}

              {translatedText && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="pointer-events-auto w-[320px] bg-neutral-950/95 backdrop-blur-2xl border border-white/10 rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-600/20 rounded-lg flex items-center justify-center">
                          <Languages className="w-4 h-4 text-blue-500" />
                        </div>
                        <span className="text-[10px] uppercase tracking-widest font-black text-neutral-500">
                          Arabic Translation
                        </span>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowTranslateBtn(false);
                        }}
                        className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-neutral-500" />
                      </button>
                    </div>
                    <p
                      dir="rtl"
                      className="text-lg font-bold text-white leading-relaxed text-right mb-6 font-arabic"
                    >
                      {translatedText}
                    </p>
                    <div className="flex gap-2">
                      <button
                        onClick={copyToClipboard}
                        className="flex-1 flex items-center justify-center gap-2 bg-white/5 hover:bg-white/10 text-white py-3 rounded-xl transition-all font-bold text-sm"
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 text-emerald-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4" />
                            Copy
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reading Marker Indicator */}
        <AnimatePresence>
          {markerPos && (
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              style={{
                position: "fixed",
                left: markerPos.x - 10,
                top: markerPos.y - 10,
              }}
              className="z-[90] pointer-events-none"
            >
              <div className="relative">
                {/* Modern subtle pulse indicator */}
                <div className="w-5 h-5 bg-blue-500/30 rounded-full animate-ping absolute inset-0" />
                <div className="w-5 h-5 bg-blue-500 border-2 border-white shadow-lg rounded-full" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
