import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Sidebar from './Sidebar';
import PDFViewer from './PDFViewer';
import EditorHeader from './EditorHeader';
import LoginModal from './LoginModal';
import toast from 'react-hot-toast';

const PDFEditor: React.FC = () => {
  const { user, canEditPDF, incrementPDFCount } = useAuth();
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [annotations, setAnnotations] = useState<any[]>([]);
  const [currentPageNumber, setCurrentPageNumber] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [toolSettings, setToolSettings] = useState({
    color: '#ff0000',
    strokeWidth: 3,
    textFormatting: {
      fontSize: 16,
      fontFamily: 'Arial',
      textColor: '#000000',
      isBold: false,
      isItalic: false,
      isUnderline: false
    }
  });

  // Update tool settings when tool changes
  React.useEffect(() => {
    if (selectedTool === 'highlight') {
      setToolSettings(prev => ({
        ...prev,
        color: prev.color.startsWith('#ffff') ? prev.color : '#ffff00',
        strokeWidth: prev.strokeWidth >= 10 ? prev.strokeWidth : 15
      }));
    } else if (selectedTool === 'draw') {
      setToolSettings(prev => ({
        ...prev,
        color: prev.color.startsWith('#ffff') ? '#ff0000' : prev.color,
        strokeWidth: prev.strokeWidth >= 10 ? 3 : prev.strokeWidth
      }));
    }
  }, [selectedTool]);

  const handleFileUpload = async (file: File) => {
    setCurrentFile(file);
    setAnnotations([]); // Clear annotations when new file is loaded
    setCurrentPageNumber(1); // Reset to first page
    setTotalPages(0); // Will be updated by PDFViewer
    
    toast.success('PDF loaded successfully!');
  };

  const handleFileUpdate = (file: File, preservePage: boolean = false) => {
    setCurrentFile(file);
    setAnnotations([]); // Clear annotations when file is updated
    if (!preservePage) {
      setCurrentPageNumber(1); // Reset to first page only if not preserving
    }
  };

  const handleToolSelection = (tool: string | null) => {
    setSelectedTool(tool);
  };

  const handleAnnotationAdd = (annotation: any) => {
    setAnnotations(prev => [...prev, annotation]);
  };

  const handleAnnotationDelete = (annotationId: string) => {
    setAnnotations(prev => prev.filter(ann => ann.id !== annotationId));
  };

  const handlePageChange = (pageNumber: number) => {
    setCurrentPageNumber(pageNumber);
  };

  const handleTotalPagesChange = (total: number) => {
    setTotalPages(total);
  };

  // Function to handle export attempts (requires authentication)
  const handleExportAttempt = () => {
    if (!user) {
      setShowLoginModal(true);
      return false;
    }
    
    // Check if user can export PDFs (usage limits)
    if (!canEditPDF()) {
      toast.error('You have reached your monthly PDF limit. Please upgrade your plan to continue.');
      return false;
    }
    
    // Increment PDF count on successful export
    incrementPDFCount();
    return true;
  };

  return (
    <>
      <div className="flex h-screen bg-gray-50 flex-col">
        <EditorHeader />
        <div className="flex flex-1 overflow-hidden">
          <Sidebar 
            onFileUpload={handleFileUpload} 
            currentFile={currentFile}
            onToolSelect={handleToolSelection}
            selectedTool={selectedTool}
            annotations={annotations}
            toolSettings={toolSettings}
            onToolSettingsChange={setToolSettings}
            currentPageNumber={currentPageNumber}
            totalPages={totalPages}
            onFileUpdate={handleFileUpdate}
            onExportAttempt={handleExportAttempt}
          />
          <PDFViewer 
            file={currentFile} 
            selectedTool={selectedTool}
            annotations={annotations}
            toolSettings={toolSettings}
            onAnnotationAdd={handleAnnotationAdd}
            onAnnotationDelete={handleAnnotationDelete}
            onPageChange={handlePageChange}
            onTotalPagesChange={handleTotalPagesChange}
            currentPageNumber={currentPageNumber}
          />
        </div>
      </div>
      
      <LoginModal 
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        title="Sign in to Export"
        message="Create a free account to export your PDF and access all features. Your work will be saved."
      />
    </>
  );
};

export default PDFEditor; 