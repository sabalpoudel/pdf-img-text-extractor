// hooks/useImageExtractor.ts
import { useState } from "react";
import Tesseract from "tesseract.js";

export const useImageExtractor = () => {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");

  const extractFromImage = async (imageFile: File): Promise<string> => {
    setLoading(true);
    setProgress(0);
    setError("");

    try {
      const result = await Tesseract.recognize(imageFile, "eng+jpn", {
        logger: (m) => {
          if (m.status === "recognizing text" && m.progress) {
            setProgress(Math.round(m.progress * 100));
          }
        },
      });
      return result.data.text;
    } catch (err) {
      setError("Failed to extract text from image. Please try again.");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { extractFromImage, loading, progress, error };
};
