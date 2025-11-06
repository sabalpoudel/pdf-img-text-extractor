// components/extractor/ExtractButton.tsx
import { Button } from "@/components/ui/button";

interface ExtractButtonProps {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}

export const ExtractButton = ({
  disabled,
  loading,
  onClick,
}: ExtractButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
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
  );
};
