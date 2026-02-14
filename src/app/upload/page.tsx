"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Upload,
  X,
  FileText,
  Loader2,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";

// Note: No top-level pdfjs imports here to avoid SSR/Prerender ReferenceError (DOMMatrix)

export default function UploadPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file");
        return;
      }

      // Check file size (100MB limit for Cloudinary free tier)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError("File too large. Maximum size is 100MB.");
        return;
      }

      setFile(selectedFile);
      if (!title) setTitle(selectedFile.name.replace(".pdf", ""));
      setError("");
    }
  };

  const generateCoverImage = async (file: File): Promise<string> => {
    // Dynamically import pdfjs on the client to avoid SSR issues
    const pdfjs = await import("pdfjs-dist");
    // Ensure worker is configured only on client
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 0.5 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    if (context) {
      await (page as any).render({ canvasContext: context, viewport }).promise;
      return canvas.toDataURL("image/jpeg", 0.7);
    }
    return "";
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const coverImage = await generateCoverImage(file);

      // Get Cloudinary signature for direct upload
      const signatureRes = await fetch("/api/cloudinary/signature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folder: "readbook" }),
      });

      if (!signatureRes.ok) {
        throw new Error("Failed to get upload signature");
      }

      const { signature, timestamp, api_key, cloud_name } = await signatureRes.json();

      // Upload directly to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("signature", signature);
      formData.append("timestamp", timestamp.toString());
      formData.append("api_key", api_key);
      // Remove folder and resource_type temporarily

      // Try auto upload endpoint which handles resource type detection
      const cloudinaryRes = await fetch(
        `https://api.cloudinary.com/v1_1/${cloud_name}/auto/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!cloudinaryRes.ok) {
        const errorText = await cloudinaryRes.text();
        console.error("Cloudinary error:", errorText);
        throw new Error(`Upload to Cloudinary failed: ${errorText}`);
      }

      const cloudinaryData = await cloudinaryRes.json();

      // Save metadata to database
      const saveRes = await fetch("/api/pdfs/save-metadata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title,
          fileName: file.name,
          cloudinaryUrl: cloudinaryData.secure_url,
          cloudinaryPublicId: cloudinaryData.public_id,
          fileSize: file.size,
          coverImage: coverImage,
        }),
      });

      if (!saveRes.ok) {
        const data = await saveRes.json();
        throw new Error(data.error || "Failed to save file metadata");
      }

      setSuccess(true);
      setTimeout(() => router.push("/library"), 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-white flex flex-col p-6">
      <div className="max-w-2xl mx-auto w-full pt-12 md:pt-24">
        <Link
          href="/library"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white transition-colors mb-8 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Library
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden"
        >
          {success && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-neutral-950/90 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-center p-6"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Upload Successful!</h2>
              <p className="text-neutral-400">Redirecting to your library...</p>
            </motion.div>
          )}

          <h1 className="text-3xl font-bold mb-8">Upload New PDF</h1>

          <form onSubmit={handleUpload} className="space-y-8">
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-400">
                Book Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                disabled={loading}
              />
            </div>

            <div className="space-y-4">
              {!file ? (
                <div className="relative border-2 border-dashed border-neutral-800 rounded-3xl p-12 flex flex-col items-center justify-center hover:border-blue-500/50 hover:bg-blue-500/[0.02] transition-all group">
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <div className="w-16 h-16 bg-neutral-950 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-neutral-500" />
                  </div>
                  <p className="text-neutral-300 font-medium">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-neutral-500 text-sm mt-1">
                    PDF documents only (max 100MB)
                  </p>
                </div>
              ) : (
                <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600/10 rounded-xl flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="font-medium truncate max-w-[200px] md:max-w-xs">
                        {file.name}
                      </p>
                      <p className="text-neutral-500 text-sm">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-500 hover:text-white transition-all"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-sm bg-red-500/10 border border-red-500/30 p-4 rounded-xl">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={!file || loading}
              className="w-full bg-white text-black font-bold py-4 rounded-2xl hover:bg-neutral-200 disabled:opacity-50 disabled:hover:bg-white transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Uploading...
                </>
              ) : (
                "Start Upload"
              )}
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
