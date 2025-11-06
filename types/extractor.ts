// types/extractor.ts
export interface ExtractorState {
  text: string;
  error: string;
  progress: number;
  loading: boolean;
  file: File | null;
}

export interface TranslationState {
  translated: string;
  translating: boolean;
  error: string;
}

export type FileType = "pdf" | "image" | "unknown";
