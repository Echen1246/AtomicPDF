import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface Point {
  x: number;
  y: number;
}

interface Annotation {
  id: string;
  type: 'text' | 'highlight' | 'draw' | 'redact' | 'sign' | 'line';
  pageNumber: number;
  points: Point[];
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
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
        if (annotation.type === 'text' || annotation.type === 'sign') {
          if (!annotation.text) continue;
          
          const isSign = annotation.type === 'sign';
          
          let font;
          if (isSign) {
            font = await pdfDoc.embedFont(StandardFonts.TimesRomanItalic);
          } else if (annotation.isBold && annotation.isItalic) {
            font = await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique);
          } else if (annotation.isBold) {
            font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          } else if (annotation.isItalic) {
            font = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);
          } else {
            font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          }

          const fontSize = annotation.fontSize || 16;
          const color = annotation.color ? hexToRgb(annotation.color) : {r: 0, g: 0, b: 0};
          
          const x = annotation.points[0].x;
          // pdf-lib origin is bottom-left, so we need to adjust y
          const y = pageHeight - annotation.points[0].y - (annotation.height || 50);
          
          page.drawText(annotation.text, {
            x: x + 5,
            y: y + (annotation.height || 50) - fontSize - 5,
            size: fontSize,
            font,
            color: rgb(color.r, color.g, color.b),
            maxWidth: (annotation.width || 200) - 10,
          });

          if (annotation.isUnderline) {
            const textWidth = font.widthOfTextAtSize(annotation.text, fontSize);
            const lineY = y + (annotation.height || 50) - fontSize - 7;
            page.drawLine({
              start: { x: x + 5, y: lineY },
              end: { x: x + 5 + textWidth, y: lineY },
              thickness: 1,
              color: rgb(color.r, color.g, color.b),
            });
          }
          
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
                color: annotation.color ? rgb(hexToRgb(annotation.color).r, hexToRgb(annotation.color).g, hexToRgb(annotation.color).b) : rgb(1, 0, 0), // Red
                opacity: 1,
              });
            }
          }
        } else if (annotation.type === 'line') {
            if (annotation.points.length < 2) continue;
            const start = annotation.points[0];
            const end = annotation.points[1];
            const color = annotation.color ? hexToRgb(annotation.color) : {r:1, g:0, b:0};
            page.drawLine({
              start: { x: start.x, y: pageHeight - start.y },
              end: { x: end.x, y: pageHeight - end.y },
              thickness: annotation.strokeWidth || 3,
              color: rgb(color.r, color.g, color.b),
            });
        } else if (annotation.type === 'redact') {
            if (annotation.points.length < 2) continue;
            const start = annotation.points[0];
            const end = annotation.points[1];
            const width = end.x - start.x;
            const height = end.y - start.y;
            page.drawRectangle({
              x: start.x,
              y: pageHeight - end.y,
              width: width,
              height: height,
              color: rgb(0, 0, 0), // Black
            });
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

function hexToRgb(hex: string): {r: number, g: number, b: number} {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16) / 255,
    g: parseInt(result[2], 16) / 255,
    b: parseInt(result[3], 16) / 255
  } : {r:0,g:0,b:0}; // Return black on failure
}

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