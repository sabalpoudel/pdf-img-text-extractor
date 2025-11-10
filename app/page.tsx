// app/page.tsx
"use client";

import { useState } from "react";
import { FileText } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Hooks
import { usePdfJs } from "@/hooks/usePdfJs";
import { useImageExtractor } from "@/hooks/useImageExtractor";
import { usePdfExtractor } from "@/hooks/usePdfExtractor";
import { useTranslation } from "@/hooks/useTranslation";

// Components
import { FileUpload } from "@/components/extractor/FileUpload";
import { FilePreview } from "@/components/extractor/FilePreview";
import { ExtractButton } from "@/components/extractor/ExtractButton";
import { ProgressBar } from "@/components/extractor/ProgressBar";
import { ErrorMessage } from "@/components/extractor/ErrorMessage";
import { StructuredTextDisplay } from "@/components/extractor/StructuredTextDisplay";
import { TextDisplay } from "@/components/extractor/TextDisplay";
import { TranslateButton } from "@/components/extractor/TranslateButton";
import { UniversalDocumentMapper } from "@/components/extractor/UniversalDocumentMapper";

export default function PdfImageTextExtractor() {
  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState<string>("");
  const [globalError, setGlobalError] = useState<string>("");

  // Initialize hooks
  const { pdfjsLib, loading: pdfJsLoading } = usePdfJs();
  const imageExtractor = useImageExtractor();
  const pdfExtractor = usePdfExtractor(pdfjsLib);
  const translation = useTranslation();

  // Determine which extractor is active
  const loading = imageExtractor.loading || pdfExtractor.loading;
  const progress = imageExtractor.loading
    ? imageExtractor.progress
    : pdfExtractor.progress;
  const extractorError = imageExtractor.error || pdfExtractor.error;

  const handleFileChange = (newFile: File | null) => {
    setFile(newFile);
    setText("");
    setGlobalError("");
    translation.resetTranslation();
  };

  const handleExtract = async () => {
    if (!file) return;

    setGlobalError("");
    setText("");
    translation.resetTranslation();

    try {
      let extractedText = "";

      if (file.type.includes("pdf")) {
        extractedText = await pdfExtractor.extractFromPDF(file);
      } else if (file.type.includes("image")) {
        extractedText = await imageExtractor.extractFromImage(file);
      } else {
        setGlobalError("Please upload a PDF or image file.");
        return;
      }

      setText(extractedText);
    } catch (err) {
      console.error("Extraction failed:", err);
    }
  };

  const handleTranslate = () => {
    translation.translateText(text);
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

  const displayError = globalError || extractorError || translation.error;

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 via-white to-purple-50 flex flex-col items-center justify-center p-4 sm:p-6">
      <Card className="w-full max-w-7xl shadow-xl border-0">
        <CardContent className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2">
              <FileText className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                PDF & Image Text Extractor
              </h1>
            </div>
            <p className="text-gray-600">
              Extract, translate, and map invoice fields from documents with OCR
              technology
            </p>
          </div>

          {/* File Upload */}
          <FileUpload file={file} onFileChange={handleFileChange} />

          {/* Extract Button */}
          <ExtractButton
            disabled={!file || loading || pdfJsLoading}
            loading={loading}
            onClick={handleExtract}
          />

          {/* Progress Bar */}
          {loading && <ProgressBar progress={progress} />}

          {/* Error Message */}
          <ErrorMessage error={displayError} />

          {/* Two Column Layout for Preview and Results */}
          {file && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column: File Preview */}
              <div>
                <FilePreview file={file} />
              </div>

              {/* Right Column: Extracted Text */}
              <div className="space-y-6">
                {text && (
                  <>
                    <StructuredTextDisplay
                      text={text}
                      onCopy={() => copyToClipboard(text)}
                      onDownload={() =>
                        downloadText(text, "extracted-text.txt")
                      }
                    />

                    {/* Universal Document Mapper */}
                    <UniversalDocumentMapper text={text} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Translate Button - Full Width */}
          {text && (
            <TranslateButton
              disabled={translation.translating}
              translating={translation.translating}
              onClick={handleTranslate}
            />
          )}

          {/* Translated Text - Full Width */}
          {translation.translated && (
            <TextDisplay
              text={translation.translated}
              title="Translated Text"
              icon="translate"
              variant="translated"
              onCopy={() => copyToClipboard(translation.translated)}
              onDownload={() =>
                downloadText(translation.translated, "translated-text.txt")
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Info Footer */}
      <p className="mt-6 text-sm text-gray-500 text-center">
        Supports English and Japanese OCR • Invoice field extraction • Free
        translation up to 5000 characters per day
      </p>
    </div>
  );
}
