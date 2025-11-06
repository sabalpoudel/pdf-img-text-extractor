// components/extractor/FilePreview.tsx
import { useState, useEffect } from "react";
import { FileText, Image as ImageIcon } from "lucide-react";

interface FilePreviewProps {
  file: File | null;
}

export const FilePreview = ({ file }: FilePreviewProps) => {
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [isPdf, setIsPdf] = useState(false);

  useEffect(() => {
    if (!file) {
      setPreviewUrl("");
      return;
    }

    const isPdfFile = file.type.includes("pdf");
    setIsPdf(isPdfFile);

    if (!isPdfFile) {
      // For images, create object URL
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else {
      // For PDFs, create object URL for iframe
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file]);

  if (!file) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold flex items-center gap-2">
        {isPdf ? (
          <>
            <FileText className="w-5 h-5 text-blue-600" />
            PDF Preview
          </>
        ) : (
          <>
            <ImageIcon className="w-5 h-5 text-blue-600" />
            Image Preview
          </>
        )}
      </h2>
      <div className="bg-gray-50 border rounded-lg p-4 max-h-[600px] overflow-auto">
        {isPdf ? (
          <iframe
            src={previewUrl}
            className="w-full h-[550px] rounded border"
            title="PDF Preview"
          />
        ) : (
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-full h-auto rounded mx-auto"
          />
        )}
      </div>
    </div>
  );
};
