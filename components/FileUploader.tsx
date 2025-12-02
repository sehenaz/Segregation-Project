import React, { useCallback, useState } from 'react';
import { UploadCloud, File, AlertCircle } from 'lucide-react';

interface FileUploaderProps {
    onFilesSelected: (files: File[]) => void;
    isProcessing: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFilesSelected, isProcessing }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        if (!isProcessing) setIsDragging(true);
    }, [isProcessing]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const validateAndPassFiles = (fileList: FileList | null) => {
        if (!fileList) return;
        
        const files: File[] = [];
        let hasInvalid = false;

        for (let i = 0; i < fileList.length; i++) {
            const file = fileList[i];
            if (file.type === 'application/pdf') {
                files.push(file);
            } else {
                hasInvalid = true;
            }
        }

        if (hasInvalid) {
            setError("Some files were skipped. Only PDF files are supported.");
            setTimeout(() => setError(null), 5000);
        }

        if (files.length > 0) {
            onFilesSelected(files);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (isProcessing) return;
        validateAndPassFiles(e.dataTransfer.files);
    }, [isProcessing, onFilesSelected]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        validateAndPassFiles(e.target.files);
    };

    return (
        <div className="w-full max-w-2xl mx-auto mb-8">
            <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative group border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-300 ease-in-out cursor-pointer
                ${isDragging 
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[1.02]' 
                    : 'border-slate-300 bg-white hover:border-indigo-400 hover:bg-slate-50'
                } ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
            >
                <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleFileInput}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    disabled={isProcessing}
                />
                
                <div className="flex flex-col items-center justify-center space-y-4">
                    <div className={`p-4 rounded-full transition-colors ${isDragging ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-500'}`}>
                        <UploadCloud className="w-8 h-8" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-slate-800">
                            Drop PDF files here
                        </h3>
                        <p className="text-slate-500 mt-1">
                            or click to browse
                        </p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                        <File className="w-3 h-3" />
                        <span>Supports single or multiple PDF files</span>
                    </div>
                </div>
            </div>

            {error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-700 rounded-lg flex items-center gap-2 animate-fadeIn">
                    <AlertCircle className="w-5 h-5 shrink-0" />
                    <p className="text-sm">{error}</p>
                </div>
            )}
        </div>
    );
};

export default FileUploader;