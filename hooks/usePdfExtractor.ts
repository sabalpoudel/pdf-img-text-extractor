// hooks/usePdfExtractor.ts
import { useState } from "react";
import Tesseract from "tesseract.js";

export const usePdfExtractor = (pdfjsLib: any) => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const extractFromPDF = async (pdfFile: File): Promise<string> => {
    if (!pdfjsLib) {
      setError("PDF library is still loading, please wait...");
      throw new Error("PDF library not loaded");
    }

    setLoading(true);
    setProgress(0);
    setError("");

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let extracted = "";

      // Try text extraction first
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        extracted += textItems + "\n";
        setProgress(Math.round((i / pdf.numPages) * 50));
      }

      // If no text found, use OCR
      if (!extracted.trim()) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) throw new Error("Canvas not supported");

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2 });
          canvas.width = viewport.width;
          canvas.height = viewport.height;

          await page.render({ canvasContext: ctx, viewport }).promise;
          const imgData = canvas.toDataURL("image/png");

          const result = await Tesseract.recognize(imgData, "eng+jpn", {
            logger: (m) => {
              if (m.status === "recognizing text" && m.progress) {
                setProgress(50 + Math.round((m.progress / pdf.numPages) * 50));
              }
            },
          });
          extracted += result.data.text + "\n";
        }
      }

      return extracted;
    } catch (err) {
      setError("Failed to extract text from PDF. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { extractFromPDF, loading, progress, error };
};
