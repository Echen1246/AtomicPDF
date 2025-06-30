import React, { useState, useEffect } from 'react';
import { 
  Type, 
  Pen, 
  Highlighter, 
  Eraser,
  Download,
  Upload,
  RotateCcw
} from 'lucide-react';
import { downloadPDFWithAnnotations } from '../utils/pdfExport';
import { 
  rotatePage, 
  mergePDFs, 
  splitPDF, 
  movePage, 
  collatePDF,
  downloadPDF, 
  createFileFromBytes 
} from '../utils/pdfOperations';
import { exportAsImages, exportAsWord, exportAsExcel } from '../utils/exportUtils';

interface SidebarProps {
  onFileUpload: (file: File) => void;
  currentFile: File | null;
  onToolSelect: (tool: string | null) => void;
  selectedTool: string | null;
  annotations: any[];
  onToolSettingsChange: (settings: any) => void;
  toolSettings: any;
  currentPageNumber: number;
  totalPages: number;
  onFileUpdate: (file: File, preservePage?: boolean) => void;
  onExportAttempt: () => boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  onFileUpload, 
  currentFile, 
  onToolSelect, 
  selectedTool, 
  annotations, 
  onToolSettingsChange, 
  toolSettings,
  currentPageNumber,
  totalPages,
  onFileUpdate,
  onExportAttempt
}) => {
  const [activeTab, setActiveTab] = useState<'tools' | 'pages' | 'export'>('tools');
  const [moveToPage, setMoveToPage] = useState(1);
  const [mergeFiles, setMergeFiles] = useState<File[]>([]);
  const [collateFromPage, setCollateFromPage] = useState(1);
  const [collateToPage, setCollateToPage] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Export settings state
  const [exportSettings, setExportSettings] = useState({
    includeAnnotations: true,
    preserveFormatting: true,
    optimizeForWeb: false
  });

  // Update form values when current page or total pages change
  useEffect(() => {
    setMoveToPage(currentPageNumber);
    setCollateFromPage(1);
    setCollateToPage(totalPages || 1);
  }, [currentPageNumber, totalPages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log('Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        onFileUpload(file);
      } else {
        alert('Please select a PDF file');
      }
    }
  };

  const tools = [
    { id: 'text', name: 'Add Text', icon: Type, description: 'Add text annotations' },
    { id: 'highlight', name: 'Highlight', icon: Highlighter, description: 'Highlight text' },
    { id: 'draw', name: 'Draw', icon: Pen, description: 'Free-hand drawing' },
    { id: 'eraser', name: 'Eraser', icon: Eraser, description: 'Erase annotations' },
  ];



  const exportOptions = [
    { id: 'pdf', name: 'Export as PDF', format: 'PDF' },
    { id: 'image', name: 'Export as Images', format: 'PNG/JPG' },
    { id: 'word', name: 'Export to Word', format: 'DOCX' },
    { id: 'excel', name: 'Export to Excel', format: 'XLSX' },
  ];

  const handleExport = async (exportType: string) => {
    if (!currentFile) {
      alert('Please upload a PDF file first');
      return;
    }

    // Check authentication and usage limits
    if (!onExportAttempt()) {
      return; // User will see login modal or usage limit message
    }

    setIsProcessing(true);
    try {
      switch (exportType) {
        case 'pdf':
          if (exportSettings.includeAnnotations) {
            await downloadPDFWithAnnotations(currentFile, annotations);
          } else {
            // Download original PDF without annotations
            const url = URL.createObjectURL(currentFile);
            const a = document.createElement('a');
            a.href = url;
            a.download = currentFile.name;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }
          break;
        
        case 'image':
          await exportAsImages(currentFile, annotations, exportSettings);
          break;
        
        case 'word':
          await exportAsWord(currentFile, annotations, exportSettings);
          break;
        
        case 'excel':
          await exportAsExcel(currentFile, annotations, exportSettings);
          break;
        
        default:
          alert(`${exportType.toUpperCase()} export not implemented yet.`);
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Page operation handlers
  const [currentRotation, setCurrentRotation] = useState(0);

  const handleRotatePage = async () => {
    if (!currentFile) return;
    setIsProcessing(true);
    try {
      // Cycle through rotations: 0° → 90° → 180° → 270° → 0°
      const nextRotation = (currentRotation + 90) % 360;
      const rotatedPdfBytes = await rotatePage(currentFile, currentPageNumber - 1, nextRotation);
      const newFile = createFileFromBytes(rotatedPdfBytes, currentFile.name);
      setCurrentRotation(nextRotation);
      onFileUpdate(newFile, true); // Preserve current page
    } catch (error) {
      console.error('Rotation failed:', error);
      alert('Failed to rotate page. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };





  const handleCollatePDF = async (fromPage: number, toPage: number) => {
    if (!currentFile || fromPage < 1 || toPage < fromPage || toPage > totalPages) return;
    
    setIsProcessing(true);
    try {
      const collatedPdfBytes = await collatePDF(currentFile, fromPage - 1, toPage - 1);
      const filename = `${currentFile.name.replace('.pdf', '')}_pages_${fromPage}-${toPage}.pdf`;
      
      // Create new file object and update the current file in the viewer
      const newFile = createFileFromBytes(collatedPdfBytes, filename);
      onFileUpdate(newFile);
      
      const pageCount = toPage - fromPage + 1;
      alert(`PDF collated successfully! Now viewing ${pageCount} pages (${fromPage}-${toPage}) from the original document.`);
    } catch (error) {
      console.error('Collate failed:', error);
      alert('Failed to collate PDF. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleMovePageTo = async (targetPage: number) => {
    if (!currentFile || targetPage === currentPageNumber || targetPage < 1 || targetPage > totalPages) {
      return;
    }
    
    setIsProcessing(true);
    try {
      const movedPdfBytes = await movePage(currentFile, currentPageNumber - 1, targetPage - 1);
      const newFile = createFileFromBytes(movedPdfBytes, currentFile.name);
      onFileUpdate(newFile);
    } catch (error) {
      console.error('Move failed:', error);
      alert('Failed to move page. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };



  const handleMergeFiles = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setMergeFiles(prev => [...prev, ...files.filter(f => f.type === 'application/pdf')]);
  };

  const confirmMergePDFs = async () => {
    if (!currentFile || mergeFiles.length === 0) return;
    
    setIsProcessing(true);
    try {
      const allFiles = [currentFile, ...mergeFiles];
      const mergedPdfBytes = await mergePDFs(allFiles);
      const mergedFilename = `merged_${Date.now()}.pdf`;
      const newFile = createFileFromBytes(mergedPdfBytes, mergedFilename);
      onFileUpdate(newFile);
      setMergeFiles([]);
    } catch (error) {
      console.error('Merge failed:', error);
      alert('Failed to merge PDFs. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getRotationDescription = () => {
    const rotations = ['Portrait', 'Landscape (90°)', 'Upside Down (180°)', 'Landscape (270°)'];
    const nextRotation = (currentRotation + 90) % 360;
    const nextIndex = nextRotation / 90;
    return `Rotate to ${rotations[nextIndex]}`;
  };

  const pageTools = [
    { id: 'rotate', name: 'Rotate Page', icon: RotateCcw, description: getRotationDescription(), handler: handleRotatePage },
  ];

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col h-full">
      {/* File Upload */}
      <div className="p-4 border-b border-gray-200">
        <label className="block">
          <input
            type="file"
            accept=".pdf"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="flex items-center justify-center w-full h-12 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors">
            <Upload className="w-5 h-5 text-gray-400 mr-2" />
            <span className="text-sm text-gray-600">
              {currentFile ? 'Change PDF' : 'Upload PDF'}
            </span>
          </div>
        </label>
        {currentFile && (
          <div className="mt-2 text-xs text-gray-500 truncate">
            {currentFile.name}
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-gray-200">
        {[
          { id: 'tools', label: 'Tools' },
          { id: 'pages', label: 'Pages' },
          { id: 'export', label: 'Export' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'tools' && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Annotation Tools</h3>
            <div className="space-y-2">
              {tools.map((tool) => {
                const Icon = tool.icon;
                return (
                  <button
                    key={tool.id}
                    onClick={() => onToolSelect(selectedTool === tool.id ? null : tool.id)}
                    className={`w-full flex items-center p-3 rounded-lg border text-left transition-all ${
                      selectedTool === tool.id
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5 mr-3" />
                    <div>
                      <div className="font-medium text-sm">{tool.name}</div>
                      <div className="text-xs text-gray-500">{tool.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Tool Settings */}
            {selectedTool && (selectedTool === 'draw' || selectedTool === 'highlight') && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Tool Settings</h4>
                
                {/* Color Selection */}
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {selectedTool === 'highlight' ? (
                      // Highlight colors
                      ['#ffff00', '#00ff00', '#ff00ff', '#00ffff', '#ff8000'].map((color) => (
                        <button
                          key={color}
                          onClick={() => onToolSettingsChange({ ...toolSettings, color })}
                          className={`w-8 h-8 rounded border-2 ${
                            toolSettings.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))
                    ) : (
                      // Draw colors
                      ['#ff0000', '#000000', '#0000ff', '#00ff00', '#ff00ff', '#ff8000', '#800080'].map((color) => (
                        <button
                          key={color}
                          onClick={() => onToolSettingsChange({ ...toolSettings, color })}
                          className={`w-8 h-8 rounded border-2 ${
                            toolSettings.color === color ? 'border-gray-800' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">
                    {selectedTool === 'highlight' ? 'Highlight Width' : 'Pen Size'}
                  </label>
                  <div className="flex gap-2">
                    {selectedTool === 'highlight' ? (
                      [10, 15, 20, 25].map((size) => (
                        <button
                          key={size}
                          onClick={() => onToolSettingsChange({ ...toolSettings, strokeWidth: size })}
                          className={`px-3 py-1 text-xs rounded border ${
                            toolSettings.strokeWidth === size
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {size}px
                        </button>
                      ))
                    ) : (
                      [1, 3, 5, 8].map((size) => (
                        <button
                          key={size}
                          onClick={() => onToolSettingsChange({ ...toolSettings, strokeWidth: size })}
                          className={`px-3 py-1 text-xs rounded border ${
                            toolSettings.strokeWidth === size
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          {size}px
                        </button>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Text Formatting Settings */}
            {selectedTool === 'text' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">Text Formatting</h4>
                
                {/* Font Family */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Font</label>
                  <select
                    value={toolSettings.textFormatting?.fontFamily || 'Arial'}
                    onChange={(e) => onToolSettingsChange({
                      ...toolSettings,
                      textFormatting: { ...toolSettings.textFormatting, fontFamily: e.target.value }
                    })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    {['Arial', 'Helvetica', 'Times New Roman', 'Georgia', 'Verdana', 'Courier New'].map((family) => (
                      <option key={family} value={family}>{family}</option>
                    ))}
                  </select>
                </div>

                {/* Font Size */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Size</label>
                  <select
                    value={toolSettings.textFormatting?.fontSize || 16}
                    onChange={(e) => onToolSettingsChange({
                      ...toolSettings,
                      textFormatting: { ...toolSettings.textFormatting, fontSize: parseInt(e.target.value) }
                    })}
                    className="w-full text-xs border border-gray-300 rounded px-2 py-1"
                  >
                    {[10, 12, 14, 16, 18, 20, 24, 28, 32].map((size) => (
                      <option key={size} value={size}>{size}px</option>
                    ))}
                  </select>
                </div>

                {/* Text Color */}
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-600 mb-2">Color</label>
                  <div className="flex gap-2 flex-wrap">
                    {['#000000', '#ff0000', '#0000ff', '#00ff00', '#ff00ff', '#ff8000', '#800080', '#808080'].map((color) => (
                      <button
                        key={color}
                        onClick={() => onToolSettingsChange({
                          ...toolSettings,
                          textFormatting: { ...toolSettings.textFormatting, textColor: color }
                        })}
                        className={`w-6 h-6 rounded border-2 ${
                          (toolSettings.textFormatting?.textColor || '#000000') === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Formatting Options */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Style</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => onToolSettingsChange({
                        ...toolSettings,
                        textFormatting: { 
                          ...toolSettings.textFormatting, 
                          isBold: !toolSettings.textFormatting?.isBold 
                        }
                      })}
                      className={`px-2 py-1 text-xs rounded border font-bold ${
                        toolSettings.textFormatting?.isBold
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      B
                    </button>
                    <button
                      onClick={() => onToolSettingsChange({
                        ...toolSettings,
                        textFormatting: { 
                          ...toolSettings.textFormatting, 
                          isItalic: !toolSettings.textFormatting?.isItalic 
                        }
                      })}
                      className={`px-2 py-1 text-xs rounded border italic ${
                        toolSettings.textFormatting?.isItalic
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      I
                    </button>
                    <button
                      onClick={() => onToolSettingsChange({
                        ...toolSettings,
                        textFormatting: { 
                          ...toolSettings.textFormatting, 
                          isUnderline: !toolSettings.textFormatting?.isUnderline 
                        }
                      })}
                      className={`px-2 py-1 text-xs rounded border underline ${
                        toolSettings.textFormatting?.isUnderline
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-300 hover:border-gray-400'
                      }`}
                    >
                      U
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'pages' && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Page Operations</h3>
            
            {/* Current Page Info */}
            <div className="mb-4 p-3 bg-blue-50 rounded-lg">
              <div className="text-sm font-medium text-blue-800">
                Current: Page {currentPageNumber} of {totalPages}
              </div>
              <div className="text-xs text-blue-600">
                Operations will affect the current page
              </div>
            </div>

            <div className="space-y-2">
              {pageTools.map((tool) => {
                const Icon = tool.icon;
                const isDisabled = !currentFile || isProcessing;
                return (
                  <button
                    key={tool.id}
                    onClick={() => !isDisabled && tool.handler()}
                    disabled={isDisabled}
                    className={`w-full flex items-center p-3 rounded-lg border text-left transition-all ${
                      isDisabled
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className={`w-5 h-5 mr-3 ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`} />
                    <div>
                      <div className="font-medium text-sm">{tool.name}</div>
                      <div className="text-xs text-gray-500">{tool.description}</div>
                    </div>
                    {isProcessing && (
                      <div className="ml-auto">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Move Page Controls */}
            {currentFile && totalPages > 1 && (
              <div className="mt-4 p-3 bg-orange-50 rounded-lg">
                <h4 className="text-sm font-semibold text-orange-800 mb-2">Move Current Page</h4>
                <div className="flex items-center gap-2">
                  <label className="text-xs text-orange-700">Move page {currentPageNumber} to position:</label>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={moveToPage}
                    onChange={(e) => setMoveToPage(parseInt(e.target.value) || 1)}
                    className="w-16 text-xs border border-orange-300 rounded px-2 py-1"
                  />
                  <button
                    onClick={() => handleMovePageTo(moveToPage)}
                    disabled={isProcessing || moveToPage === currentPageNumber}
                    className="text-xs bg-orange-500 text-white px-3 py-1 rounded hover:bg-orange-600 disabled:opacity-50"
                  >
                    {isProcessing ? 'Moving...' : 'Move'}
                  </button>
                </div>
                <div className="text-xs text-orange-600 mt-1">
                  Enter a position between 1 and {totalPages}
                </div>
              </div>
            )}

            {/* Merge PDFs Controls */}
            {currentFile && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <h4 className="text-sm font-semibold text-green-800 mb-2">Merge PDFs</h4>
                <div className="space-y-2">
                  <p className="text-xs text-green-700">Current: {currentFile.name}</p>
                  <input
                    type="file"
                    multiple
                    accept=".pdf"
                    onChange={handleMergeFiles}
                    className="w-full text-xs border border-green-300 rounded px-2 py-1"
                  />
                  {mergeFiles.length > 0 && (
                    <div>
                      <p className="text-xs text-green-600 mb-1">Files to merge ({mergeFiles.length}):</p>
                      <ul className="text-xs space-y-1 max-h-20 overflow-y-auto">
                        {mergeFiles.map((file, index) => (
                          <li key={index} className="truncate text-green-700">• {file.name}</li>
                        ))}
                      </ul>
                      <button
                        onClick={confirmMergePDFs}
                        disabled={isProcessing}
                        className="mt-2 w-full text-xs bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600 disabled:opacity-50"
                      >
                        {isProcessing ? 'Merging...' : `Merge ${mergeFiles.length + 1} PDFs`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Collate PDF Controls */}
            {currentFile && totalPages > 1 && (
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <h4 className="text-sm font-semibold text-purple-800 mb-2">Collate PDF</h4>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs text-purple-700">From page:</label>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={collateFromPage}
                    onChange={(e) => setCollateFromPage(parseInt(e.target.value) || 1)}
                    className="w-16 text-xs border border-purple-300 rounded px-2 py-1"
                  />
                  <label className="text-xs text-purple-700">To page:</label>
                  <input
                    type="number"
                    min="1"
                    max={totalPages}
                    value={collateToPage}
                    onChange={(e) => setCollateToPage(parseInt(e.target.value) || 1)}
                    className="w-16 text-xs border border-purple-300 rounded px-2 py-1"
                  />
                </div>
                <button
                  onClick={() => handleCollatePDF(collateFromPage, collateToPage)}
                  disabled={isProcessing || collateFromPage > collateToPage || collateFromPage < 1 || collateToPage > totalPages}
                  className="w-full text-xs bg-purple-500 text-white px-3 py-1 rounded hover:bg-purple-600 disabled:opacity-50"
                >
                  {isProcessing ? 'Collating...' : `Collate Pages ${collateFromPage}-${collateToPage}`}
                </button>
                <div className="text-xs text-purple-600 mt-1">
                  Creates new PDF with only selected page range
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'export' && (
          <div className="p-4">
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Export Options</h3>
            <div className="space-y-2">
              {exportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleExport(option.id)}
                  disabled={!currentFile || isProcessing}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border text-left transition-all ${
                    !currentFile || isProcessing
                      ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div>
                    <div className="font-medium text-sm">{option.name}</div>
                    <div className="text-xs text-gray-500">{option.format}</div>
                  </div>
                  {isProcessing ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  ) : (
                    <Download className="w-4 h-4 text-gray-400" />
                  )}
                </button>
              ))}
            </div>
            
            <div className="mt-6 p-3 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Export Settings</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    checked={exportSettings.includeAnnotations}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      includeAnnotations: e.target.checked
                    }))}
                  />
                  <span className="text-xs text-gray-600">Include annotations</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    checked={exportSettings.preserveFormatting}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      preserveFormatting: e.target.checked
                    }))}
                  />
                  <span className="text-xs text-gray-600">Preserve formatting</span>
                </label>
                <label className="flex items-center">
                  <input 
                    type="checkbox" 
                    className="mr-2" 
                    checked={exportSettings.optimizeForWeb}
                    onChange={(e) => setExportSettings(prev => ({
                      ...prev,
                      optimizeForWeb: e.target.checked
                    }))}
                  />
                  <span className="text-xs text-gray-600">Optimize for web</span>
                </label>
              </div>
              
              {annotations.length > 0 && (
                <div className="mt-3 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  📝 {annotations.length} annotation{annotations.length !== 1 ? 's' : ''} ready for export
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Selected Tool Info */}
      {selectedTool && (
        <div className="p-4 border-t border-gray-200 bg-blue-50">
          <div className="text-sm font-medium text-blue-800">
            {tools.find(t => t.id === selectedTool)?.name} Tool Active
          </div>
          <div className="text-xs text-blue-600 mt-1">
            Click on the PDF to start using this tool
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar; 