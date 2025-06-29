import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Point {
  x: number;
  y: number;
}

interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'draw';
  pageNumber: number;
  points: Point[];
  text?: string;
  color?: string;
  fontSize?: number;
  strokeWidth?: number;
  width?: number;
  height?: number;
}

export const exportPDFWithAnnotations = async (
  originalPdfFile: File,
  annotations: Annotation[]
): Promise<Uint8Array> => {
  try {
    // Read the original PDF
    const originalPdfBytes = await originalPdfFile.arrayBuffer();
    const pdfDoc = await PDFDocument.load(originalPdfBytes);
    
    // Get pages
    const pages = pdfDoc.getPages();
    
    // Group annotations by page
    const annotationsByPage = new Map<number, Annotation[]>();
    annotations.forEach(annotation => {
      const pageAnnotations = annotationsByPage.get(annotation.pageNumber) || [];
      pageAnnotations.push(annotation);
      annotationsByPage.set(annotation.pageNumber, pageAnnotations);
    });
    
    // Add annotations to each page
    for (const [pageIndex, pageAnnotations] of Array.from(annotationsByPage.entries())) {
      const page = pages[pageIndex - 1]; // pageNumber is 1-indexed, array is 0-indexed
      if (!page) continue;
      
      const { height: pageHeight } = page.getSize();
      
      for (const annotation of pageAnnotations) {
        if (annotation.type === 'text' && annotation.text) {
          // Add text annotation
          const fontSize = annotation.fontSize || 16;
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          // Convert coordinates (our coordinates are from top-left, PDF is from bottom-left)
          const x = annotation.points[0].x;
          const y = pageHeight - annotation.points[0].y - (annotation.height || 50);
          
          // Add a rectangle background for the text
          page.drawRectangle({
            x,
            y,
            width: annotation.width || 200,
            height: annotation.height || 50,
            color: rgb(1, 1, 1), // White background
            opacity: 0.9,
            borderColor: rgb(1, 0, 0), // Red border
            borderWidth: 1,
          });
          
          // Add the text
          page.drawText(annotation.text, {
            x: x + 5,
            y: y + (annotation.height || 50) - fontSize - 5,
            size: fontSize,
            font,
            color: rgb(1, 0, 0), // Red text
            maxWidth: (annotation.width || 200) - 10,
          });
          
        } else if (annotation.type === 'highlight') {
          // Add highlight annotation
          if (annotation.points.length > 1) {
            // Create a path for the highlight
            for (let i = 0; i < annotation.points.length - 1; i++) {
              const point1 = annotation.points[i];
              const point2 = annotation.points[i + 1];
              
              // Convert coordinates
              const x1 = point1.x;
              const y1 = pageHeight - point1.y;
              const x2 = point2.x;
              const y2 = pageHeight - point2.y;
              
              // Draw line segments for highlight
              page.drawLine({
                start: { x: x1, y: y1 },
                end: { x: x2, y: y2 },
                thickness: annotation.strokeWidth || 15,
                color: rgb(1, 1, 0), // Yellow
                opacity: 0.4,
              });
            }
          }
          
        } else if (annotation.type === 'draw') {
          // Add drawing annotation
          if (annotation.points.length > 1) {
            for (let i = 0; i < annotation.points.length - 1; i++) {
              const point1 = annotation.points[i];
              const point2 = annotation.points[i + 1];
              
              // Convert coordinates
              const x1 = point1.x;
              const y1 = pageHeight - point1.y;
              const x2 = point2.x;
              const y2 = pageHeight - point2.y;
              
              // Draw line segments
              page.drawLine({
                start: { x: x1, y: y1 },
                end: { x: x2, y: y2 },
                thickness: annotation.strokeWidth || 3,
                color: rgb(1, 0, 0), // Red
                opacity: 1,
              });
            }
          }
        }
      }
    }
    
    // Serialize the PDF
    const pdfBytes = await pdfDoc.save();
    return pdfBytes;
    
  } catch (error) {
    console.error('Error exporting PDF with annotations:', error);
    throw new Error('Failed to export PDF with annotations');
  }
};

export const downloadPDFWithAnnotations = async (
  originalPdfFile: File,
  annotations: Annotation[],
  filename?: string
) => {
  try {
    const pdfBytes = await exportPDFWithAnnotations(originalPdfFile, annotations);
    
    // Create download link
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `${originalPdfFile.name.replace('.pdf', '_annotated.pdf')}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Clean up
    URL.revokeObjectURL(url);
    
  } catch (error) {
    console.error('Error downloading PDF:', error);
    throw error;
  }
}; 