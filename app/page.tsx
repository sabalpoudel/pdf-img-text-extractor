"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Copy, Download, FileText, Languages, Upload } from "lucide-react";
import Tesseract from "tesseract.js";

export default function PdfImageTextExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [translated, setTranslated] = useState<string>("");
  const [translating, setTranslating] = useState<boolean>(false);
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const loadPdfJs = async () => {
      const pdfjs = await import("pdfjs-dist");
      pdfjs.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url
      ).toString();
      setPdfjsLib(pdfjs);
    };
    loadPdfJs();
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setText("");
      setTranslated("");
      setError("");
    }
  };

  const extractFromImage = async (imageFile: File) => {
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
      setText(result.data.text);
    } catch (err) {
      setError("Failed to extract text from image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const extractFromPDF = async (pdfFile: File) => {
    if (!pdfjsLib) {
      setError("PDF library is still loading, please wait...");
      return;
    }

    setLoading(true);
    setProgress(0);
    setError("");

    try {
      const arrayBuffer = await pdfFile.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let extracted = "";

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textItems = textContent.items
          .map((item: any) => item.str)
          .join(" ");
        extracted += textItems + "\n";
        setProgress(Math.round((i / pdf.numPages) * 50));
      }

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

      setText(extracted);
    } catch (err) {
      setError("Failed to extract text from PDF. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleExtract = async () => {
    if (!file) return;

    if (file.type.includes("pdf")) {
      await extractFromPDF(file);
    } else if (file.type.includes("image")) {
      await extractFromImage(file);
    } else {
      setError("Please upload a PDF or image file.");
    }
  };

  const handleTranslate = async () => {
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

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    alert("Copied to clipboard!");
  };

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-4xl shadow-xl border-0">
        <CardContent className="p-6 sm:p-8 space-y-6">
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PDF & Image Text Extractor
              </h1>
            </div>
            <p className="text-gray-600">
              Extract and translate text from documents with OCR technology
            </p>
          </div>

          {/* File Upload */}
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors">
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={handleFileChange}
              className="hidden"
              id="file-upload"
            />
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-700 mb-2">
                {file ? file.name : "Click to upload or drag and drop"}
              </p>
              <p className="text-sm text-gray-500">PDF, PNG, JPG up to 10MB</p>
            </label>
          </div>

          {/* Extract Button */}
          <Button
            onClick={handleExtract}
            disabled={!file || loading || !pdfjsLib}
            className="w-full h-12 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin">⏳</span>
                Extracting...
              </span>
            ) : (
              "Extract Text"
            )}
          </Button>

          {/* Progress Bar */}
          {loading && (
            <div className="space-y-2">
              <Progress value={progress} className="w-full h-3" />
              <p className="text-center text-sm text-gray-600">
                {progress}% Complete
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Extracted Text */}
          {text && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Extracted Text
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(text)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadText(text, "extracted-text.txt")}
                    className="flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {text}
                </pre>
              </div>
            </div>
          )}

          {/* Translate Button */}
          {text && (
            <Button
              onClick={handleTranslate}
              disabled={translating}
              className="w-full h-12 text-lg bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
            >
              {translating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span>
                  Translating...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Languages className="w-5 h-5" />
                  Translate to English
                </span>
              )}
            </Button>
          )}

          {/* Translated Text */}
          {translated && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Languages className="w-5 h-5 text-green-600" />
                  Translated Text
                </h2>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(translated)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="w-4 h-4" />
                    Copy
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      downloadText(translated, "translated-text.txt")
                    }
                    className="flex items-center gap-1"
                  >
                    <Download className="w-4 h-4" />
                    Download
                  </Button>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-teal-50 border border-green-200 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="whitespace-pre-wrap text-sm font-mono">
                  {translated}
                </pre>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Footer */}
      <p className="mt-6 text-sm text-gray-500 text-center">
        Supports English and Japanese OCR • Free translation up to 5000
        characters per day
      </p>
    </div>
  );
}
