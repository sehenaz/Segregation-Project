import * as pdfjsLib from 'pdfjs-dist';
import { jsPDF } from 'jspdf';
import JSZip from 'jszip';
import { ProcessedPage, DocumentCategory } from '../types';

// Initialize PDF.js worker
// Use the .mjs worker for better ES module compatibility in modern browsers
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export const loadPdfDocument = async (file: File): Promise<pdfjsLib.PDFDocumentProxy> => {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  return loadingTask.promise;
};

export const renderPageToImage = async (
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNumber: number,
  scale = 1.5
): Promise<string> => {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  
  if (!context) throw new Error('Could not get canvas context');

  canvas.height = viewport.height;
  canvas.width = viewport.width;

  const renderContext = {
    canvasContext: context,
    viewport: viewport,
  };

  // Cast to any to resolve type mismatch where 'canvas' property is expected by types but 'canvasContext' is used by runtime
  await page.render(renderContext as any).promise;

  return canvas.toDataURL('image/jpeg', 0.85);
};

export const generatePdfFromPages = (pages: ProcessedPage[], filename: string) => {
  if (pages.length === 0) return;

  const doc = new jsPDF();

  pages.forEach((page, index) => {
    if (index > 0) doc.addPage();
    
    const imgProps = doc.getImageProperties(page.imageUrl);
    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    doc.addImage(page.imageUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
  });

  doc.save(filename);
};

export const generateZipFromPages = async (pages: ProcessedPage[], baseFilename: string) => {
  const zip = new JSZip();
  
  pages.forEach((page, i) => {
    // Remove data:image/jpeg;base64, prefix
    const data = page.imageUrl.split(',')[1];
    const categorySlug = (page.subCategory || page.category).replace(/\s+/g, '_').toLowerCase();
    const fileName = `${baseFilename}_${categorySlug}_p${page.pageNumber}.jpg`;
    zip.file(fileName, data, { base64: true });
  });

  const content = await zip.generateAsync({ type: 'blob' });
  
  // Trigger download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${baseFilename}_images.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const generateSeparatedPdfsZip = async (pages: ProcessedPage[], baseFilename: string) => {
  const zip = new JSZip();
  
  // Group pages by subCategory (or category if sub is missing)
  const groups: Record<string, ProcessedPage[]> = {};
  
  pages.forEach(p => {
    // Clean name for filename usage
    const rawName = p.subCategory || p.category;
    const cleanName = rawName.replace(/[^a-zA-Z0-9-_]/g, '_');
    
    if (!groups[cleanName]) {
      groups[cleanName] = [];
    }
    groups[cleanName].push(p);
  });

  // Generate a PDF for each group
  for (const [name, groupPages] of Object.entries(groups)) {
    const doc = new jsPDF();
    
    // Sort pages by file order or page number if needed
    groupPages.sort((a, b) => {
         if (a.originalFileId !== b.originalFileId) {
             return a.originalFileId.localeCompare(b.originalFileId);
         }
         return a.pageNumber - b.pageNumber;
    });

    groupPages.forEach((page, index) => {
      if (index > 0) doc.addPage();
      const imgProps = doc.getImageProperties(page.imageUrl);
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      doc.addImage(page.imageUrl, 'JPEG', 0, 0, pdfWidth, pdfHeight);
    });

    const pdfBlob = doc.output('blob');
    zip.file(`${name}.pdf`, pdfBlob);
  }

  const content = await zip.generateAsync({ type: 'blob' });
  
  // Trigger download
  const link = document.createElement('a');
  link.href = URL.createObjectURL(content);
  link.download = `${baseFilename}_separated_pdfs.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};