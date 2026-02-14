"use client";

import { useEffect, useRef, useState } from "react";
import { Page } from "react-pdf";

interface LazyPageProps {
  pageNumber: number;
  width: number;
  renderTextLayer: boolean;
  renderAnnotationLayer: boolean;
  scrollLatency?: number;
}

export default function LazyPage({
  pageNumber,
  width,
  renderTextLayer,
  renderAnnotationLayer,
  scrollLatency = 1200,
}: LazyPageProps) {
  const [isVisible, setIsVisible] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Once it's visible and rendered, we can stop observing if we want to keep it in memory
          // Or keep observing if we want to unmount it when it leaves to save even more memory
          // For now, let's keep it mounted once it's seen for a smoother scroll back up
          // observer.unobserve(entry.target);
        } else {
          // Option to unmount when not visible to save memory on massive PDFs
          // setIsVisible(false);
        }
      },
      {
        rootMargin: `${scrollLatency}px 0px`, // Dynamic pre-rendering offset
        threshold: 0.01,
      },
    );

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className={`bg-white overflow-hidden transition-all duration-700 min-h-[400px] flex items-center justify-center w-full`}
    >
      {isVisible ? (
        <Page
          pageNumber={pageNumber}
          width={width}
          renderAnnotationLayer={renderAnnotationLayer}
          renderTextLayer={renderTextLayer}
          loading={
            <div className="bg-neutral-800 w-full aspect-[1/1.414] animate-pulse rounded-sm" />
          }
        />
      ) : (
        <div className="bg-neutral-800 w-full aspect-[1/1.414] animate-pulse rounded-sm" />
      )}
    </div>
  );
}
