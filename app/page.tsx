"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import Tesseract from "tesseract.js";

export default function PdfImageTextExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [translated, setTranslated] = useState<string>("");
  const [pdfjsLib, setPdfjsLib] = useState<any>(null);

  // Dynamically import pdfjs-dist only on client side
  useEffect(() => {
    const loadPdfJs = async () => {
      const pdfjs = await import("pdfjs-dist");

      // Configure worker
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
    }
  };

  const extractFromImage = async (imageFile: File) => {
    setLoading(true);
    setProgress(0);

    const result = await Tesseract.recognize(imageFile, "eng+jpn", {
      logger: (m) => {
        if (m.status === "recognizing text" && m.progress) {
          setProgress(Math.round(m.progress * 100));
        }
      },
    });

    setText(result.data.text);
    setLoading(false);
  };

  const extractFromPDF = async (pdfFile: File) => {
    if (!pdfjsLib) {
      alert("PDF library is still loading, please wait...");
      return;
    }

    setLoading(true);
    setProgress(0);

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

      setProgress(Math.round((i / pdf.numPages) * 50)); // first 50% for text layer
    }

    // OCR fallback if no text
    if (!extracted.trim()) {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

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
              // remaining 50% for OCR
              setProgress(50 + Math.round((m.progress / pdf.numPages) * 50));
            }
          },
        });

        extracted += result.data.text + "\n";
      }
    }

    setText(extracted);
    setLoading(false);
  };

  const handleExtract = async () => {
    if (!file) return;

    if (file.type.includes("pdf")) {
      await extractFromPDF(file);
    } else if (file.type.includes("image")) {
      await extractFromImage(file);
    } else {
      alert("Please upload a PDF or image file.");
    }
  };

  const handleTranslate = async () => {
    if (!text.trim()) return;

    try {
      // const res = await fetch("/api/translate", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ text }),
      // });
      // const data = await res.json();
      // setTranslated(data.translatedText);
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
          text
        )}&langpair=auto|en`
      );
      const data = await res.json();
      setTranslated(data.responseData.translatedText);
    } catch {
      alert("Translation failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
      <Card className="w-full max-w-xl shadow-md">
        <CardContent className="p-6 space-y-4">
          <h1 className="text-2xl font-semibold text-center">
            PDF / Image Text Extractor
          </h1>

          <input
            type="file"
            accept="application/pdf,image/*"
            onChange={handleFileChange}
            className="w-full border p-2 rounded"
          />

          <Button
            onClick={handleExtract}
            disabled={!file || loading || !pdfjsLib}
            className="w-full"
          >
            {loading ? "Extracting..." : "Extract Text"}
          </Button>

          {loading && <Progress value={progress} className="w-full h-2" />}

          {text && (
            <div className="mt-4 bg-white border p-3 rounded overflow-y-auto max-h-96">
              <pre className="whitespace-pre-wrap text-sm">{text}</pre>
            </div>
          )}

          {text && (
            <Button onClick={handleTranslate} className="w-full">
              Translate Extracted Text
            </Button>
          )}

          {translated && (
            <div className="mt-4 bg-green-50 border p-3 rounded overflow-y-auto max-h-96">
              <h2 className="font-semibold mb-2">Translated Text:</h2>
              <pre className="whitespace-pre-wrap text-sm">{translated}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
