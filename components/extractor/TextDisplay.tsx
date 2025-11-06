// components/extractor/TextDisplay.tsx
import { Copy, Download, FileText, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TextDisplayProps {
  text: string;
  title: string;
  icon: "file" | "translate";
  variant?: "default" | "translated";
  onCopy: () => void;
  onDownload: () => void;
}

export const TextDisplay = ({
  text,
  title,
  icon,
  variant = "default",
  onCopy,
  onDownload,
}: TextDisplayProps) => {
  if (!text) return null;

  const Icon = icon === "file" ? FileText : Languages;
  const bgClass =
    variant === "translated"
      ? "bg-gradient-to-br from-green-50 to-teal-50 border border-green-200"
      : "bg-white border";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Icon
            className={`w-5 h-5 ${
              variant === "translated" ? "text-green-600" : ""
            }`}
          />
          {title}
        </h2>
        <div className="flex gap-2">
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
      <div className={`${bgClass} rounded-lg p-4 max-h-96 overflow-y-auto`}>
        <pre className="whitespace-pre-wrap text-sm font-mono">{text}</pre>
      </div>
    </div>
  );
};
