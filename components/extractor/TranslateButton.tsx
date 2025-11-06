// components/extractor/TranslateButton.tsx
import { Languages } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TranslateButtonProps {
  disabled: boolean;
  translating: boolean;
  onClick: () => void;
}

export const TranslateButton = ({
  disabled,
  translating,
  onClick,
}: TranslateButtonProps) => {
  return (
    <Button
      onClick={onClick}
      disabled={disabled}
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
  );
};
