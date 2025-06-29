import React, { useState } from 'react';
import { Document, Page } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import AnnotationLayer from './AnnotationLayer';

// Set up the worker using local file (no network dependency)
import { pdfjs } from 'react-pdf';
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.js';

// Test worker setup
console.log('PDF.js version:', pdfjs.version);
console.log('Worker source:', pdfjs.GlobalWorkerOptions.workerSrc);

interface PDFViewerProps {
  file: File | null;
  selectedTool: string | null;
  annotations: any[];
  toolSettings: any;
  onAnnotationAdd: (annotation: any) => void;
  onAnnotationDelete: (annotationId: string) => void;
  onPageChange: (pageNumber: number) => void;
  onTotalPagesChange: (total: number) => void;
  currentPageNumber?: number;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ 
  file, 
  selectedTool, 
  annotations, 
  toolSettings, 
  onAnnotationAdd, 
  onAnnotationDelete,
  onPageChange,
  onTotalPagesChange,
  currentPageNumber
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [fileData, setFileData] = useState<string | File | null>(null);
  const [pageWidth, setPageWidth] = useState<number>(0);
  const [pageHeight, setPageHeight] = useState<number>(0);

  // Convert file to proper format for react-pdf
  React.useEffect(() => {
    if (file) {
      console.log('Processing file:', file.name, 'Type:', file.type, 'Size:', file.size);
      
      // Try creating an object URL first - this is often more reliable
      const objectUrl = URL.createObjectURL(file);
      console.log('Created object URL:', objectUrl);
      setFileData(objectUrl);
      
      // Only reset page to 1 if no currentPageNumber is provided (new file upload)
      // If currentPageNumber is provided, it means this is a file update (like rotation)
      if (currentPageNumber === undefined) {
        setPageNumber(1);
      }
      
      // Cleanup URL when component unmounts or file changes
      return () => {
        URL.revokeObjectURL(objectUrl);
      };
    } else {
      setFileData(null);
    }
  }, [file, currentPageNumber]);

  // Sync internal page state with prop
  React.useEffect(() => {
    if (currentPageNumber && currentPageNumber !== pageNumber) {
      setPageNumber(currentPageNumber);
    }
  }, [currentPageNumber, pageNumber]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    
    // Use currentPageNumber if provided, otherwise default to 1
    const targetPage = currentPageNumber && currentPageNumber <= numPages ? currentPageNumber : 1;
    setPageNumber(targetPage);
    onTotalPagesChange(numPages);
    onPageChange(targetPage);
    console.log('PDF loaded successfully with', numPages, 'pages, starting at page', targetPage);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Failed to load PDF:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      stack: error.stack
    });
  }

  function onPageLoadSuccess(page: any) {
    setPageWidth(page.width);
    setPageHeight(page.height);
    console.log('Page loaded, dimensions:', page.width, 'x', page.height);
    console.log('Current scale:', scale);
    console.log('Scaled dimensions:', page.width * scale, 'x', page.height * scale);
  }

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 3.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));
  const previousPage = () => {
    const newPage = Math.max(pageNumber - 1, 1);
    setPageNumber(newPage);
    onPageChange(newPage);
  };
  const nextPage = () => {
    const newPage = Math.min(pageNumber + 1, numPages);
    setPageNumber(newPage);
    onPageChange(newPage);
  };

  if (!file) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-32 h-32 mx-auto mb-4 bg-gray-300 rounded-lg flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-gray-600 text-lg">Upload a PDF to get started</p>
          <p className="text-gray-500 text-sm mt-2">Drag and drop a PDF file or click to browse</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gray-100">
      {/* PDF Controls */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={previousPage}
            disabled={pageNumber <= 1}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">
            Page {pageNumber} of {numPages}
          </span>
          <button
            onClick={nextPage}
            disabled={pageNumber >= numPages}
            className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={zoomOut}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            -
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={zoomIn}
            className="px-3 py-1 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            +
          </button>
        </div>
      </div>

      {/* PDF Display */}
      <div className="flex-1 overflow-auto p-4 flex justify-center">
        <div className="bg-white shadow-lg relative">
          <Document
            file={fileData}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                <span className="ml-2 text-gray-600">Loading PDF...</span>
              </div>
            }
            error={
              <div className="flex items-center justify-center p-8 text-red-600">
                <span>Failed to load PDF. Please try another file.</span>
              </div>
            }
            className="flex justify-center"
          >
            <Page 
              pageNumber={pageNumber} 
              scale={scale}
              className="shadow-md"
              onLoadSuccess={onPageLoadSuccess}
              loading={
                <div className="flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              }
              error={
                <div className="flex items-center justify-center p-4 text-red-600">
                  <span>Failed to load page</span>
                </div>
              }
            />
            
            {/* Annotation Layer Overlay */}
            {pageWidth > 0 && pageHeight > 0 && (
              <AnnotationLayer
                selectedTool={selectedTool}
                pdfScale={scale}
                pageWidth={pageWidth}
                pageHeight={pageHeight}
                currentPage={pageNumber}
                toolSettings={toolSettings}
                onAnnotationAdd={onAnnotationAdd}
                onAnnotationDelete={onAnnotationDelete}
              />
            )}
            
            {/* Debug info - removed for clean interface */}
            {/* <div className="absolute top-0 left-0 bg-black text-white p-2 text-xs z-50">
              Selected Tool: {selectedTool || 'None'}<br/>
              Page: {pageWidth}x{pageHeight}<br/>
              Scale: {scale}
            </div> */}
          </Document>
        </div>
      </div>
    </div>
  );
};

export default PDFViewer; 