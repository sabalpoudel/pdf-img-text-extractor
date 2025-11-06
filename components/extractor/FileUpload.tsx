// components/extractor/FileUpload.tsx
import { ChangeEvent } from "react";
import { Upload } from "lucide-react";

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
}

export const FileUpload = ({ file, onFileChange }: FileUploadProps) => {
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onFileChange(e.target.files[0]);
    }
  };

  return (
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
  );
};
