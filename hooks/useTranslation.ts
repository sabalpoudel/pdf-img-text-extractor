// hooks/useTranslation.ts
import { useState } from "react";

export const useTranslation = () => {
  const [translated, setTranslated] = useState("");
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState("");

  const translateText = async (text: string): Promise<void> => {
    if (!text.trim()) return;

    setTranslating(true);
    setError("");

    try {
      // Split text into chunks of 400 characters (safe limit)
      const chunkSize = 400;
      const chunks: string[] = [];
      for (let i = 0; i < text.length; i += chunkSize) {
        chunks.push(text.slice(i, i + chunkSize));
      }

      // Translate chunks with delay to avoid rate limiting
      const translations: string[] = [];
      for (let i = 0; i < chunks.length; i++) {
        const res = await fetch(
          `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
            chunks[i]
          )}&langpair=ja|en`
        );
        const data = await res.json();

        if (data.responseData && data.responseData.translatedText) {
          translations.push(data.responseData.translatedText);
        }

        // Add delay between requests to avoid rate limiting
        if (i < chunks.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }

      setTranslated(translations.join(" "));
    } catch (err) {
      setError(
        "Translation failed. The text might be too long. Try with shorter text."
      );
    } finally {
      setTranslating(false);
    }
  };

  const resetTranslation = () => {
    setTranslated("");
    setError("");
  };

  return { translated, translating, error, translateText, resetTranslation };
};
