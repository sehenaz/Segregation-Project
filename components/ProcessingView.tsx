import React, { useState, useMemo } from 'react';
import { ProcessedPage, DocumentCategory, ExtractionFormat } from '../types';
import { generatePdfFromPages, generateZipFromPages, generateSeparatedPdfsZip } from '../services/pdfService';
import { FileDown, Image as ImageIcon, CheckCircle2, Circle, ArrowLeft, Loader2, FileText, Split, Edit2 } from 'lucide-react';

interface ProcessingViewProps {
    pages: ProcessedPage[];
    fileName: string;
    onBack: () => void;
    onUpdatePageDetails: (pageId: string, updates: Partial<ProcessedPage>) => void;
}

const ProcessingView: React.FC<ProcessingViewProps> = ({ pages, fileName, onBack, onUpdatePageDetails }) => {
    const [selectedCategory, setSelectedCategory] = useState<DocumentCategory | 'ALL'>('ALL');
    const [selectedPageIds, setSelectedPageIds] = useState<Set<string>>(new Set());
    const [isExporting, setIsExporting] = useState(false);

    const categories = Object.values(DocumentCategory);

    // Filter pages based on top tab selection
    const filteredPages = useMemo(() => {
        if (selectedCategory === 'ALL') return pages;
        return pages.filter(p => p.category === selectedCategory);
    }, [pages, selectedCategory]);

    const togglePageSelection = (id: string) => {
        const newSet = new Set(selectedPageIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedPageIds(newSet);
    };

    const selectAllVisible = () => {
        const newSet = new Set(selectedPageIds);
        filteredPages.forEach(p => newSet.add(p.id));
        setSelectedPageIds(newSet);
    };

    const deselectAllVisible = () => {
        const newSet = new Set(selectedPageIds);
        filteredPages.forEach(p => newSet.delete(p.id));
        setSelectedPageIds(newSet);
    };

    const handleExtract = async (format: ExtractionFormat) => {
        if (selectedPageIds.size === 0) return;
        
        setIsExporting(true);
        try {
            // Get the actual page objects for the selected IDs
            const pagesToExport = pages
                .filter(p => selectedPageIds.has(p.id))
                .sort((a, b) => {
                    if (a.originalFileId !== b.originalFileId) {
                        return a.originalFileId.localeCompare(b.originalFileId);
                    }
                    return a.pageNumber - b.pageNumber;
                });

            // Use the session title or the first file's name as base
            const baseName = fileName.replace(/[\s\(\)]+/g, '_').replace('.pdf', '') || 'extracted';

            if (format === 'PDF') {
                await generatePdfFromPages(pagesToExport, `${baseName}_merged.pdf`);
            } else if (format === 'SEPARATED_PDF') {
                await generateSeparatedPdfsZip(pagesToExport, baseName);
            } else {
                await generateZipFromPages(pagesToExport, baseName);
            }
        } catch (error) {
            console.error("Export failed", error);
            alert("Export failed. Please try again.");
        } finally {
            setIsExporting(false);
        }
    };

    const getCategoryColor = (cat: DocumentCategory) => {
        switch (cat) {
            case DocumentCategory.KYC: return 'bg-blue-100 text-blue-700 border-blue-200';
            case DocumentCategory.AF: return 'bg-cyan-100 text-cyan-700 border-cyan-200';
            case DocumentCategory.PHOTO: return 'bg-purple-100 text-purple-700 border-purple-200';
            case DocumentCategory.IC: return 'bg-green-100 text-green-700 border-green-200';
            case DocumentCategory.CIBIL: return 'bg-orange-100 text-orange-700 border-orange-200';
            case DocumentCategory.TIR: return 'bg-teal-100 text-teal-700 border-teal-200';
            case DocumentCategory.LD: return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header / Toolbar */}
            <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-6 py-4">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-full transition-colors text-slate-500">
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800 truncate max-w-md">{fileName}</h2>
                            <p className="text-sm text-slate-500">
                                {pages.length} Pages • {selectedPageIds.size} Selected
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => handleExtract('PDF')}
                            disabled={selectedPageIds.size === 0 || isExporting}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                                selectedPageIds.size > 0 
                                ? 'bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 hover:border-indigo-300' 
                                : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <FileDown className="w-4 h-4" />}
                            Merge PDF
                        </button>

                        <button
                            onClick={() => handleExtract('SEPARATED_PDF')}
                            disabled={selectedPageIds.size === 0 || isExporting}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                                selectedPageIds.size > 0 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Split className="w-4 h-4" />}
                            Separate PDFs
                        </button>
                        
                        <button
                            onClick={() => handleExtract('IMAGE')}
                            disabled={selectedPageIds.size === 0 || isExporting}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg font-medium transition-all ${
                                selectedPageIds.size > 0 
                                ? 'bg-pink-600 text-white hover:bg-pink-700 shadow-md' 
                                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                            }`}
                        >
                            {isExporting ? <Loader2 className="w-4 h-4 animate-spin"/> : <ImageIcon className="w-4 h-4" />}
                            Extract Images
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="mt-6 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('ALL')}
                        className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                            selectedCategory === 'ALL' 
                            ? 'bg-slate-800 text-white' 
                            : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        All ({pages.length})
                    </button>
                    {categories.map(cat => {
                        const count = pages.filter(p => p.category === cat).length;
                        if (count === 0) return null;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border ${
                                    selectedCategory === cat 
                                    ? getCategoryColor(cat) + ' border-transparent ring-2 ring-offset-1 ring-slate-200'
                                    : 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50'
                                }`}
                            >
                                {cat} ({count})
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Selection Toolbar */}
            <div className="bg-slate-100 px-6 py-2 border-b border-slate-200 flex justify-between items-center text-sm">
                <span className="text-slate-500">Showing {filteredPages.length} pages</span>
                <div className="space-x-4">
                    <button onClick={selectAllVisible} className="text-indigo-600 font-medium hover:text-indigo-800">Select All</button>
                    <button onClick={deselectAllVisible} className="text-slate-500 font-medium hover:text-slate-700">Deselect All</button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {filteredPages.map((page) => (
                        <div 
                            key={page.id} 
                            className={`group relative bg-white rounded-xl shadow-sm border-2 transition-all duration-200 overflow-hidden ${
                                selectedPageIds.has(page.id) 
                                ? 'border-indigo-500 ring-2 ring-indigo-100' 
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                        >
                            {/* Selection Overlay Checkbox */}
                            <div 
                                onClick={() => togglePageSelection(page.id)}
                                className="absolute top-2 left-2 z-10 cursor-pointer"
                            >
                                {selectedPageIds.has(page.id) ? (
                                    <CheckCircle2 className="w-6 h-6 text-indigo-600 bg-white rounded-full" />
                                ) : (
                                    <Circle className="w-6 h-6 text-slate-400 bg-white/80 rounded-full hover:text-slate-600" />
                                )}
                            </div>

                            {/* Image Preview */}
                            <div 
                                className="aspect-[3/4] bg-slate-100 relative cursor-pointer"
                                onClick={() => togglePageSelection(page.id)}
                            >
                                <img 
                                    src={page.imageUrl} 
                                    alt={`Page ${page.pageNumber}`} 
                                    className="w-full h-full object-contain" 
                                    loading="lazy"
                                />
                                {page.isProcessing && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
                                    </div>
                                )}
                                
                                {/* Overlay File Name */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
                                    <p className="text-white text-[10px] truncate flex items-center gap-1 opacity-90">
                                        <FileText className="w-3 h-3" />
                                        {page.originalFileId}
                                    </p>
                                </div>
                            </div>

                            {/* Footer Controls */}
                            <div className="p-3 bg-white border-t border-slate-100 space-y-2">
                                <div className="flex justify-between items-start">
                                    <span className="text-xs font-semibold text-slate-400">Page {page.pageNumber}</span>
                                    {!page.isProcessing && (
                                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${getCategoryColor(page.category)}`}>
                                            {page.category}
                                        </span>
                                    )}
                                </div>
                                
                                <div className="space-y-1">
                                    <select
                                        value={page.category}
                                        onChange={(e) => onUpdatePageDetails(page.id, { category: e.target.value as DocumentCategory })}
                                        className="w-full text-xs p-1.5 rounded border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                    >
                                        {categories.map(cat => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                    
                                    {/* Sub-category edit */}
                                    <div className="relative">
                                        <input 
                                            type="text"
                                            value={page.subCategory || ''}
                                            onChange={(e) => onUpdatePageDetails(page.id, { subCategory: e.target.value })}
                                            placeholder="Doc Type (e.g. Aadhar)"
                                            className="w-full text-xs p-1.5 pl-6 rounded border border-slate-200 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 truncate"
                                        />
                                        <Edit2 className="w-3 h-3 text-slate-400 absolute left-2 top-2" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ProcessingView;