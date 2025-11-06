// components/extractor/ProgressBar.tsx
import { Progress } from "@/components/ui/progress";

interface ProgressBarProps {
  progress: number;
}

export const ProgressBar = ({ progress }: ProgressBarProps) => {
  return (
    <div className="space-y-2">
      <Progress value={progress} className="w-full h-3" />
      <p className="text-center text-sm text-gray-600">{progress}% Complete</p>
    </div>
  );
};
