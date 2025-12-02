export enum DocumentCategory {
  KYC = 'KYC', // Know Your Customer (ID proofs)
  AF = 'AF', // Application Form
  PHOTO = 'Photo', // Photo/Image
  IC = 'IC', // Income Certificate
  CIBIL = 'CIBIL', // Credit Score
  TIR = 'TIR', // Tax Income Return
  LD = 'LD', // Legal Document
  OTHER = 'Other'
}

export interface ProcessedPage {
  id: string;
  pageNumber: number;
  originalFileId: string;
  imageUrl: string; // Base64 data URL
  category: DocumentCategory;
  subCategory?: string; // Specific type e.g., 'Aadhar', 'PAN'
  confidence?: number;
  isProcessing: boolean;
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  uploadDate: number; // Timestamp
  pageCount: number;
  categorySummary?: Record<string, number>; // Count per category
}

export interface AppState {
  history: UploadedFile[];
  currentSession: {
    files: File[];
    pages: ProcessedPage[];
    isProcessing: boolean;
    processingProgress: number; // 0 to 100
  } | null;
}

export type ExtractionFormat = 'PDF' | 'IMAGE' | 'SEPARATED_PDF';