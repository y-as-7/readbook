"use client";

import { useMemo } from "react";
import { Document, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2 } from "lucide-react";
import LazyPage from "./LazyPage";
import { useWindowSize } from "@/hooks/useWindowSize";

// Configure worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PDFReaderProps {
  pdfContent?: string;
  url?: string;
  numPages: number;
  onDocumentLoadSuccess: (data: { numPages: number }) => void;
  isDarkMode: boolean;
  scrollLatency?: number;
}

export default function PDFReader({
  pdfContent,
  url,
  numPages,
  onDocumentLoadSuccess,
  isDarkMode,
  scrollLatency = 1200,
}: PDFReaderProps) {
  const { width } = useWindowSize();
  const pageWidth = Math.min((width || 0) - 48, 900);

  const file = useMemo(() => {
    if (url) return url;
    if (!pdfContent) return null;
    const content = pdfContent.trim();
    if (content.startsWith("data:")) {
      return content;
    }
    return `data:application/pdf;base64,${content}`;
  }, [pdfContent, url]);

  return (
    <Document
      file={file}
      onLoadSuccess={onDocumentLoadSuccess}
      loading={
        <div className="flex flex-col items-center gap-4 py-20">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <p className="text-neutral-400 font-medium">Preparing document...</p>
        </div>
      }
      error={
        <div className="text-red-500 py-20 uppercase font-black tracking-widest text-center px-6">
          Failed to load PDF. Please try again.
        </div>
      }
    >
      {Array.from(new Array(numPages), (el, index) => (
        <LazyPage
          key={`page_${index + 1}`}
          pageNumber={index + 1}
          width={pageWidth}
          renderAnnotationLayer={false}
          renderTextLayer={true}
          scrollLatency={scrollLatency}
        />
      ))}
    </Document>
  );
}
