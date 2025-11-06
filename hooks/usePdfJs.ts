// hooks/usePdfJs.ts
import { useState, useEffect } from "react";

export const usePdfJs = () => {
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPdfJs = async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url
        ).toString();
        setPdfjsLib(pdfjs);
      } catch (error) {
        console.error("Failed to load PDF.js:", error);
      } finally {
        setLoading(false);
      }
    };
    loadPdfJs();
  }, []);

  return { pdfjsLib, loading };
};
