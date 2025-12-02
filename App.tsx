import React, { useState, useEffect } from 'react';
import { UploadedFile, ProcessedPage, DocumentCategory } from './types';
import { loadPdfDocument, renderPageToImage } from './services/pdfService';
import { classifyDocumentPage } from './services/geminiService';
import { getHistory, saveHistoryItem } from './services/storageService';
import FileUploader from './components/FileUploader';
import HistoryTable from './components/HistoryTable';
import ProcessingView from './components/ProcessingView';
import { Loader2, LayoutDashboard, BrainCircuit } from 'lucide-react';

const App: React.FC = () => {
  const [history, setHistory] = useState<UploadedFile[]>([]);
  const [sessionTitle, setSessionTitle] = useState<string>('');
  const [processedPages, setProcessedPages] = useState<ProcessedPage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [view, setView] = useState<'HOME' | 'PROCESSING'>('HOME');

  useEffect(() => {
    setHistory(getHistory());
  }, []);

  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    // Set a session title (Single filename or Batch info)
    const title = files.length === 1 ? files[0].name : `Batch Upload (${files.length} files)`;
    setSessionTitle(title);
    
    setIsProcessing(true);
    setProcessedPages([]);
    setProgress({ current: 0, total: 0 }); 
    
    try {
      // 1. Load all PDFs to get total page count first
      const loadedDocs = [];
      let totalPageCount = 0;

      for (const file of files) {
        const pdf = await loadPdfDocument(file);
        loadedDocs.push({ file, pdf });
        totalPageCount += pdf.numPages;
      }
      
      setProgress({ current: 0, total: totalPageCount });

      const allPages: ProcessedPage[] = [];
      let pagesProcessed = 0;

      // 2. Render pages from all documents
      for (const { file, pdf } of loadedDocs) {
        for (let i = 1; i <= pdf.numPages; i++) {
          const imageUrl = await renderPageToImage(pdf, i);
          
          const pageId = `${file.name}-${i}-${Date.now()}`;
          const page: ProcessedPage = {
            id: pageId,
            pageNumber: i,
            originalFileId: file.name,
            imageUrl,
            category: DocumentCategory.OTHER, // Default
            isProcessing: true // Flag for Gemini
          };
          allPages.push(page);
          
          // Update state progressively
          setProcessedPages(prev => [...prev, page]);
          
          pagesProcessed++;
          setProgress({ current: pagesProcessed, total: totalPageCount });
        }
      }

      // 3. Switch view and start AI Classification
      setView('PROCESSING');
      setIsProcessing(false); 
      
      // Trigger AI classification for all pages
      classifyPages(allPages, files);

    } catch (error) {
      console.error("Error processing PDFs", error);
      alert("Failed to process PDF files. Please check if the files are valid.");
      setIsProcessing(false);
      setSessionTitle('');
    }
  };

  const classifyPages = async (pages: ProcessedPage[], files: File[]) => {
    // Create a copy to track updates
    let updatedPages = [...pages];

    // Process in parallel with concurrency limit
    const BATCH_SIZE = 3;
    for (let i = 0; i < pages.length; i += BATCH_SIZE) {
      const batch = pages.slice(i, i + BATCH_SIZE);
      
      const promises = batch.map(async (page) => {
        const result = await classifyDocumentPage(page.imageUrl);
        return { id: page.id, ...result };
      });

      const results = await Promise.all(promises);

      // Update state with results
      setProcessedPages(current => {
        const next = current.map(p => {
            const res = results.find(r => r.id === p.id);
            if (res) {
                return { 
                    ...p, 
                    category: res.category, 
                    subCategory: res.subCategory,
                    isProcessing: false 
                };
            }
            return p;
        });
        updatedPages = next; // Keep local ref updated
        return next;
      });
    }

    // All done, save history for EACH file individually
    files.forEach(file => {
        // Filter pages belonging to this file
        const filePages = updatedPages.filter(p => p.originalFileId === file.name);
        
        const categoryCounts: Record<string, number> = {};
        filePages.forEach(p => {
            categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
        });

        const historyItem: UploadedFile = {
            id: `${file.name}-${Date.now()}`,
            name: file.name,
            size: file.size,
            uploadDate: Date.now(),
            pageCount: filePages.length,
            categorySummary: categoryCounts
        };

        saveHistoryItem(historyItem);
    });

    setHistory(getHistory());
  };

  const handleUpdatePageDetails = (pageId: string, updates: Partial<ProcessedPage>) => {
    setProcessedPages(prev => prev.map(p => 
        p.id === pageId ? { ...p, ...updates } : p
    ));
  };

  const handleBack = () => {
    if (confirm("Are you sure you want to go back? Unsaved progress will be lost.")) {
        setView('HOME');
        setSessionTitle('');
        setProcessedPages([]);
    }
  };

  if (view === 'PROCESSING') {
    return (
        <ProcessingView 
            pages={processedPages}
            fileName={sessionTitle}
            onBack={handleBack}
            onUpdatePageDetails={handleUpdatePageDetails}
        />
    );
  }

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="bg-indigo-600 text-white p-2 rounded-lg">
                    <BrainCircuit className="w-5 h-5" />
                </div>
                <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                    DocuSort AI
                </h1>
            </div>
            <div className="text-sm text-slate-500 hidden sm:block">
                Powered by Gemini 2.5 Flash
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-10">
        
        {/* Hero Section */}
        <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">
                Intelligent Document Classification
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                Upload your PDF bundles. We'll automatically identify KYC forms (Aadhar, PAN, etc.), Photos, Income Proofs, and more.
            </p>
        </div>

        <FileUploader 
            onFilesSelected={handleFilesSelected} 
            isProcessing={isProcessing} 
        />

        {isProcessing && progress && (
            <div className="max-w-md mx-auto mb-12 bg-white p-6 rounded-xl border border-slate-200 shadow-lg animate-in fade-in zoom-in duration-300">
                <div className="flex items-center gap-3 mb-3">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                    <span className="font-semibold text-slate-800">Processing Document...</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div 
                        className="bg-indigo-600 h-full transition-all duration-300 ease-out"
                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                </div>
                <p className="text-xs text-slate-500 mt-2 text-right">
                    Rendering page {progress.current} of {progress.total}
                </p>
            </div>
        )}

        <div className="mt-12">
            <div className="flex items-center gap-2 mb-6">
                <LayoutDashboard className="w-5 h-5 text-slate-400" />
                <h3 className="text-lg font-semibold text-slate-800">Recent Activity</h3>
            </div>
            <HistoryTable history={history} />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-6 text-center text-slate-400 text-sm">
            &copy; {new Date().getFullYear()} DocuSort AI. Private & Secure Processing.
        </div>
      </footer>
    </div>
  );
};

export default App;