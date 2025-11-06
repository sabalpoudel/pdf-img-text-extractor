// components/extractor/StructuredTextDisplay.tsx
import { Copy, Download, FileText, Split } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface StructuredTextDisplayProps {
  text: string;
  onCopy: () => void;
  onDownload: () => void;
}

type ViewMode = "raw" | "lines" | "words";

export const StructuredTextDisplay = ({
  text,
  onCopy,
  onDownload,
}: StructuredTextDisplayProps) => {
  const [viewMode, setViewMode] = useState<ViewMode>("raw");

  if (!text) return null;

  const renderContent = () => {
    switch (viewMode) {
      case "lines":
        const lines = text.split("\n").filter((line) => line.trim());
        return (
          <div className="space-y-2">
            {lines.map((line, idx) => (
              <div
                key={idx}
                className="border-l-2 border-blue-400 pl-3 py-1 hover:bg-blue-50 transition-colors"
              >
                <span className="inline-block w-12 text-xs text-gray-400 font-mono">
                  L{idx + 1}
                </span>
                <span className="text-sm font-mono">{line}</span>
              </div>
            ))}
          </div>
        );

      case "words":
        const words = text.split(/\s+/).filter((word) => word.trim());
        return (
          <div className="flex flex-wrap gap-2">
            {words.map((word, idx) => (
              <span
                key={idx}
                className="px-2 py-1 bg-gray-100 rounded text-sm font-mono hover:bg-blue-100 transition-colors border border-gray-300"
                title={`Word ${idx + 1}`}
              >
                {word}
              </span>
            ))}
          </div>
        );

      case "raw":
      default:
        return (
          <pre className="whitespace-pre-wrap text-sm font-mono">{text}</pre>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Extracted Text
        </h2>
        <div className="flex gap-2 flex-wrap">
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "raw" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("raw")}
              className="h-8 text-xs"
            >
              Raw
            </Button>
            <Button
              variant={viewMode === "lines" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("lines")}
              className="h-8 text-xs"
            >
              <Split className="w-3 h-3 mr-1" />
              Lines
            </Button>
            <Button
              variant={viewMode === "words" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("words")}
              className="h-8 text-xs"
            >
              Words
            </Button>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onCopy}
            className="flex items-center gap-1"
          >
            <Copy className="w-4 h-4" />
            Copy
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onDownload}
            className="flex items-center gap-1"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </div>
      <div className="bg-white border rounded-lg p-4 max-h-96 overflow-y-auto">
        {renderContent()}
      </div>
    </div>
  );
};
