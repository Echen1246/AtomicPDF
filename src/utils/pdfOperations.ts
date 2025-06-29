import { PDFDocument, degrees } from 'pdf-lib';

export const rotatePage = async (pdfFile: File, pageIndex: number, rotation: number): Promise<Uint8Array> => {
  try {
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    if (pageIndex < 0 || pageIndex >= pages.length) {
      throw new Error('Invalid page index');
    }
    
    const page = pages[pageIndex];
    page.setRotation(degrees(rotation));
    
    const modifiedPdfBytes = await pdfDoc.save();
    return modifiedPdfBytes;
  } catch (error) {
    console.error('Error rotating page:', error);
    throw new Error('Failed to rotate page');
  }
};



export const mergePDFs = async (pdfFiles: File[]): Promise<Uint8Array> => {
  try {
    const mergedPdf = await PDFDocument.create();
    
    for (const file of pdfFiles) {
      const pdfBytes = await file.arrayBuffer();
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }
    
    const mergedPdfBytes = await mergedPdf.save();
    return mergedPdfBytes;
  } catch (error) {
    console.error('Error merging PDFs:', error);
    throw new Error('Failed to merge PDFs');
  }
};

export const splitPDF = async (pdfFile: File, fromPageIndex?: number, toPageIndex?: number): Promise<{ pageNumber: number, pdfBytes: Uint8Array }[]> => {
  try {
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    
    // Default to all pages if no range specified
    const startIndex = fromPageIndex ?? 0;
    const endIndex = toPageIndex ?? pageCount - 1;
    
    // Validate range
    if (startIndex < 0 || endIndex >= pageCount || startIndex > endIndex) {
      throw new Error('Invalid page range');
    }
    
    const splitPdfs: { pageNumber: number, pdfBytes: Uint8Array }[] = [];
    
    for (let i = startIndex; i <= endIndex; i++) {
      const newPdf = await PDFDocument.create();
      const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
      newPdf.addPage(copiedPage);
      
      const newPdfBytes = await newPdf.save();
      splitPdfs.push({
        pageNumber: i + 1,
        pdfBytes: newPdfBytes
      });
    }
    
    return splitPdfs;
  } catch (error) {
    console.error('Error splitting PDF:', error);
    throw new Error('Failed to split PDF');
  }
};

export const collatePDF = async (pdfFile: File, fromPageIndex: number, toPageIndex: number): Promise<Uint8Array> => {
  try {
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pageCount = pdfDoc.getPageCount();
    
    // Validate range
    if (fromPageIndex < 0 || toPageIndex >= pageCount || fromPageIndex > toPageIndex) {
      throw new Error('Invalid page range');
    }
    
    // Create new PDF with only the specified page range
    const newPdf = await PDFDocument.create();
    const pageIndices = [];
    
    for (let i = fromPageIndex; i <= toPageIndex; i++) {
      pageIndices.push(i);
    }
    
    // Copy the pages in the specified range
    const copiedPages = await newPdf.copyPages(pdfDoc, pageIndices);
    copiedPages.forEach(page => newPdf.addPage(page));
    
    const collatedPdfBytes = await newPdf.save();
    return collatedPdfBytes;
  } catch (error) {
    console.error('Error collating PDF:', error);
    throw new Error('Failed to collate PDF');
  }
};

export const movePage = async (pdfFile: File, fromIndex: number, toIndex: number): Promise<Uint8Array> => {
  try {
    const pdfBytes = await pdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(pdfBytes);
    const pages = pdfDoc.getPages();
    
    if (fromIndex < 0 || fromIndex >= pages.length || toIndex < 0 || toIndex >= pages.length) {
      throw new Error('Invalid page index');
    }
    
    if (fromIndex === toIndex) {
      return new Uint8Array(pdfBytes);
    }
    
    // Create a new PDF with pages in the new order
    const newPdf = await PDFDocument.create();
    const allPages = await newPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
    
    // Calculate the new order
    const reorderedPages = [...allPages];
    const [movedPage] = reorderedPages.splice(fromIndex, 1);
    reorderedPages.splice(toIndex, 0, movedPage);
    
    // Add pages in new order
    reorderedPages.forEach(page => newPdf.addPage(page));
    
    const modifiedPdfBytes = await newPdf.save();
    return modifiedPdfBytes;
  } catch (error) {
    console.error('Error moving page:', error);
    throw new Error('Failed to move page');
  }
};

export const downloadPDF = (pdfBytes: Uint8Array, filename: string) => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
};

export const createFileFromBytes = (pdfBytes: Uint8Array, filename: string): File => {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return new File([blob], filename, { type: 'application/pdf' });
}; 