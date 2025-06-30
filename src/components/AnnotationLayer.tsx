import React, { useRef, useEffect, useState, useCallback } from 'react';

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
  fontFamily?: string;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  strokeWidth?: number;
  width?: number;
  height?: number;
}

interface AnnotationLayerProps {
  selectedTool: string | null;
  pdfScale: number;
  pageWidth: number;
  pageHeight: number;
  currentPage: number;
  toolSettings: any;
  onAnnotationAdd?: (annotation: Annotation) => void;
  onAnnotationDelete?: (annotationId: string) => void;
  disabled?: boolean; // Add disabled prop for when modals are open
}

const AnnotationLayer: React.FC<AnnotationLayerProps> = ({ 
  selectedTool, 
  pdfScale, 
  pageWidth, 
  pageHeight,
  currentPage,
  toolSettings,
  onAnnotationAdd,
  onAnnotationDelete,
  disabled = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);
  const [allAnnotations, setAllAnnotations] = useState<Annotation[]>([]);
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInputBounds, setTextInputBounds] = useState<{x: number, y: number, width: number, height: number}>({ x: 0, y: 0, width: 200, height: 50 });
  const [textInputValue, setTextInputValue] = useState('');
  const [isCreatingTextBox, setIsCreatingTextBox] = useState(false);
  
  // Text formatting from toolSettings
  const textFormatting = toolSettings.textFormatting || {
    fontSize: 16,
    fontFamily: 'Arial',
    textColor: '#000000',
    isBold: false,
    isItalic: false,
    isUnderline: false
  };

  const scaledWidth = pageWidth * pdfScale;
  const scaledHeight = pageHeight * pdfScale;

  // Get annotations for current page only
  const currentPageAnnotations = allAnnotations.filter(ann => ann.pageNumber === currentPage);

  // Get mouse position relative to canvas
  const getMousePos = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    
    const rect = canvas.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / pdfScale,
      y: (e.clientY - rect.top) / pdfScale
    };
  }, [pdfScale]);

  // Check if point is inside annotation bounds
  const isPointInAnnotation = useCallback((point: Point, annotation: Annotation): boolean => {
    if (annotation.type === 'text' && annotation.width && annotation.height) {
      const x = annotation.points[0].x;
      const y = annotation.points[0].y;
      return point.x >= x && point.x <= x + annotation.width &&
             point.y >= y && point.y <= y + annotation.height;
    } else if (annotation.type === 'draw' || annotation.type === 'highlight') {
      // For drawn lines, check if point is close to any line segment with generous threshold for easier erasing
      const threshold = Math.max(annotation.strokeWidth || 5, 15); // At least 15px threshold for easier erasing
      for (let i = 0; i < annotation.points.length - 1; i++) {
        const dist = distanceToLineSegment(point, annotation.points[i], annotation.points[i + 1]);
        if (dist <= threshold) return true;
      }
    }
    return false;
  }, []);

  // Distance from point to line segment
  const distanceToLineSegment = (point: Point, lineStart: Point, lineEnd: Point): number => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    const dx = point.x - xx;
    const dy = point.y - yy;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Handle eraser functionality
  const eraseAtPoint = useCallback((point: Point) => {
    const toDelete = currentPageAnnotations.find(ann => isPointInAnnotation(point, ann));
    if (toDelete) {
      setAllAnnotations(prev => prev.filter(ann => ann.id !== toDelete.id));
      if (onAnnotationDelete) onAnnotationDelete(toDelete.id);
    }
  }, [currentPageAnnotations, isPointInAnnotation, onAnnotationDelete]);

  // Drawing functions
  const startDrawing = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!selectedTool || !canvasRef.current || disabled) return;

    const pos = getMousePos(e);
    
    if (selectedTool === 'text') {
      setIsCreatingTextBox(true);
      setIsDrawing(true);
      setCurrentPath([pos]);
      return;
    }

    if (selectedTool === 'eraser') {
      eraseAtPoint(pos);
      setIsDrawing(true); // Allow dragging to continue erasing
      return;
    }

    setIsDrawing(true);
    setCurrentPath([pos]);
  }, [selectedTool, getMousePos, eraseAtPoint]);

  const draw = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !selectedTool || !canvasRef.current) return;

    const pos = getMousePos(e);
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (selectedTool === 'text' && isCreatingTextBox) {
      // Clear canvas and redraw annotations
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      redrawAnnotations();
      
      // Draw the textbox being created
      const startPos = currentPath[0];
      const width = Math.abs(pos.x - startPos.x);
      const height = Math.abs(pos.y - startPos.y);
      const x = Math.min(startPos.x, pos.x);
      const y = Math.min(startPos.y, pos.y);
      
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(x * pdfScale, y * pdfScale, width * pdfScale, height * pdfScale);
      ctx.setLineDash([]);
      return;
    }

    if (selectedTool === 'eraser') {
      eraseAtPoint(pos);
      // Redraw canvas to show visual feedback of erased annotations
      redrawAnnotations();
      return;
    }

    if (selectedTool !== 'draw' && selectedTool !== 'highlight') return;

    const currentColor = toolSettings.color || (selectedTool === 'highlight' ? '#ffff00' : '#ff0000');
    const currentStrokeWidth = toolSettings.strokeWidth || (selectedTool === 'highlight' ? 15 : 3);

    ctx.globalAlpha = selectedTool === 'highlight' ? 0.4 : 1.0;
    ctx.strokeStyle = currentColor;
    ctx.lineWidth = currentStrokeWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (currentPath.length > 0) {
      ctx.beginPath();
      ctx.moveTo(currentPath[currentPath.length - 1].x * pdfScale, currentPath[currentPath.length - 1].y * pdfScale);
      ctx.lineTo(pos.x * pdfScale, pos.y * pdfScale);
      ctx.stroke();
    }

    setCurrentPath(prev => [...prev, pos]);
  }, [isDrawing, selectedTool, getMousePos, currentPath, pdfScale, isCreatingTextBox, eraseAtPoint, toolSettings.color, toolSettings.strokeWidth]);

  const stopDrawing = useCallback(() => {
    if (!isDrawing) return;

    if (selectedTool === 'text' && isCreatingTextBox && currentPath.length > 0) {
      // Get the final mouse position from the last drawn rectangle
      const canvas = canvasRef.current;
      if (canvas) {
        const startPos = currentPath[0];
        // We need to get the end position, let's use a reasonable default
        const endPos = currentPath[currentPath.length - 1] || startPos;
        const width = Math.abs(endPos.x - startPos.x) || 200;
        const height = Math.abs(endPos.y - startPos.y) || 50;
        const x = Math.min(startPos.x, endPos.x);
        const y = Math.min(startPos.y, endPos.y);
        
        setTextInputBounds({ x, y, width: Math.max(width, 100), height: Math.max(height, 30) });
        setShowTextInput(true);
        setIsCreatingTextBox(false);
      }
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    if (currentPath.length === 0 || selectedTool === 'eraser') {
      setIsDrawing(false);
      setCurrentPath([]);
      return;
    }

    // Save annotation for current page
    const currentColor = toolSettings.color || (selectedTool === 'highlight' ? '#ffff00' : '#ff0000');
    const currentStrokeWidth = toolSettings.strokeWidth || (selectedTool === 'highlight' ? 15 : 3);
    
    const newAnnotation: Annotation = {
      id: Date.now().toString(),
      type: selectedTool as 'text' | 'highlight' | 'draw',
      pageNumber: currentPage,
      points: currentPath,
      color: currentColor,
      strokeWidth: currentStrokeWidth
    };

    setAllAnnotations(prev => [...prev, newAnnotation]);
    if (onAnnotationAdd) onAnnotationAdd(newAnnotation);
    
    setIsDrawing(false);
    setCurrentPath([]);
  }, [isDrawing, currentPath, selectedTool, onAnnotationAdd, currentPage, isCreatingTextBox, toolSettings.color, toolSettings.strokeWidth]);

  // Handle text input
  const handleTextSubmit = useCallback(() => {
    if (textInputValue.trim()) {
      const newAnnotation: Annotation = {
        id: Date.now().toString(),
        type: 'text',
        pageNumber: currentPage,
        points: [{ x: textInputBounds.x, y: textInputBounds.y }],
        text: textInputValue,
        fontSize: textFormatting.fontSize,
        fontFamily: textFormatting.fontFamily,
        color: textFormatting.textColor,
        isBold: textFormatting.isBold,
        isItalic: textFormatting.isItalic,
        isUnderline: textFormatting.isUnderline,
        width: textInputBounds.width,
        height: textInputBounds.height
      };

      setAllAnnotations(prev => [...prev, newAnnotation]);
      if (onAnnotationAdd) onAnnotationAdd(newAnnotation);
    }

    setShowTextInput(false);
    setTextInputValue('');
    setIsCreatingTextBox(false);
  }, [textInputValue, textInputBounds, onAnnotationAdd, currentPage, textFormatting.fontFamily, textFormatting.fontSize, textFormatting.isBold, textFormatting.isItalic, textFormatting.isUnderline, textFormatting.textColor]);

  // Redraw annotations for current page only
  const redrawAnnotations = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    currentPageAnnotations.forEach(annotation => {
      if (annotation.type === 'text' && annotation.text && annotation.points.length > 0) {
        const x = annotation.points[0].x * pdfScale;
        const y = annotation.points[0].y * pdfScale;
        const width = (annotation.width || 200) * pdfScale;
        
        // Draw text (no background or border for cleaner look)
        
        // Build font string with formatting
        const fontSize = (annotation.fontSize || 16) * pdfScale;
        const fontFamily = annotation.fontFamily || 'Arial';
        const fontWeight = annotation.isBold ? 'bold' : 'normal';
        const fontStyle = annotation.isItalic ? 'italic' : 'normal';
        
        ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`;
        ctx.fillStyle = annotation.color || '#000000';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        
                 // Wrap text to fit in the box
         const words = annotation.text.split(' ');
         const lineHeight = fontSize * 1.2;
         let currentLine = '';
         let yOffset = y + 5;
         
         const textLines: { text: string; y: number }[] = [];
         
         for (const word of words) {
           const testLine = currentLine + word + ' ';
           const metrics = ctx.measureText(testLine);
           
           if (metrics.width > width - 10 && currentLine !== '') {
             textLines.push({ text: currentLine.trim(), y: yOffset });
             currentLine = word + ' ';
             yOffset += lineHeight;
           } else {
             currentLine = testLine;
           }
         }
         if (currentLine.trim()) {
           textLines.push({ text: currentLine.trim(), y: yOffset });
         }
         
         // Draw text lines
         textLines.forEach(line => {
           ctx.fillText(line.text, x + 5, line.y);
           
           // Add underline if specified
           if (annotation.isUnderline) {
             const textWidth = ctx.measureText(line.text).width;
             ctx.beginPath();
             ctx.moveTo(x + 5, line.y + fontSize);
             ctx.lineTo(x + 5 + textWidth, line.y + fontSize);
             ctx.strokeStyle = annotation.color || '#000000';
             ctx.lineWidth = 1;
             ctx.stroke();
           }
         });
              } else if (annotation.type === 'draw' || annotation.type === 'highlight') {
          ctx.globalAlpha = annotation.type === 'highlight' ? 0.4 : 1;
          ctx.strokeStyle = annotation.color || (annotation.type === 'highlight' ? '#ffff00' : '#ff0000');
          ctx.lineWidth = annotation.strokeWidth || (annotation.type === 'highlight' ? 15 : 3);
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        if (annotation.points.length > 1) {
          ctx.beginPath();
          ctx.moveTo(annotation.points[0].x * pdfScale, annotation.points[0].y * pdfScale);
          for (let i = 1; i < annotation.points.length; i++) {
            ctx.lineTo(annotation.points[i].x * pdfScale, annotation.points[i].y * pdfScale);
          }
          ctx.stroke();
        }
      }
      ctx.globalAlpha = 1;
    });
  }, [currentPageAnnotations, pdfScale]);

  // Update canvas size when PDF scale changes or page changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = scaledWidth;
      canvas.height = scaledHeight;
      redrawAnnotations();
    }
  }, [scaledWidth, scaledHeight, redrawAnnotations]);

  return (
    <div 
      ref={overlayRef}
      className={`absolute inset-0 ${disabled ? 'pointer-events-none' : 'pointer-events-auto'}`}
      style={{ 
        width: scaledWidth, 
        height: scaledHeight,
        zIndex: disabled ? 1 : 1000 // Lower z-index when disabled so modals appear on top
      }}
    >
      <canvas
        ref={canvasRef}
        width={scaledWidth}
        height={scaledHeight}
        className={`absolute inset-0 ${disabled ? 'pointer-events-none cursor-default' : selectedTool === 'eraser' ? 'cursor-not-allowed' : 'cursor-crosshair'}`}
        onMouseDown={disabled ? undefined : startDrawing}
        onMouseMove={disabled ? undefined : (isDrawing ? draw : undefined)}
        onMouseUp={disabled ? undefined : stopDrawing}
        onMouseLeave={disabled ? undefined : () => stopDrawing()}
      />
      
      {/* Text Input Overlay */}
      {showTextInput && (
        <div
          className="absolute z-10 bg-transparent"
          style={{
            left: textInputBounds.x * pdfScale,
            top: textInputBounds.y * pdfScale,
            width: textInputBounds.width * pdfScale,
            height: textInputBounds.height * pdfScale,
          }}
        >
          <textarea
            value={textInputValue}
            onChange={(e) => setTextInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) handleTextSubmit();
              if (e.key === 'Escape') {
                setShowTextInput(false);
                setTextInputValue('');
              }
            }}
            onBlur={handleTextSubmit}
            autoFocus
            className="w-full h-full p-2 resize-none border-none outline-none bg-white bg-opacity-90 rounded"
            placeholder="Enter text... (Ctrl+Enter to save, Esc to cancel)"
            style={{
              fontSize: `${textFormatting.fontSize}px`,
              fontFamily: textFormatting.fontFamily,
              color: textFormatting.textColor,
              fontWeight: textFormatting.isBold ? 'bold' : 'normal',
              fontStyle: textFormatting.isItalic ? 'italic' : 'normal',
              textDecoration: textFormatting.isUnderline ? 'underline' : 'none'
            }}
          />
        </div>
      )}



      {/* Annotations Count Display for current page */}
      {currentPageAnnotations.length > 0 && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Page {currentPage}: {currentPageAnnotations.length} annotation{currentPageAnnotations.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
};

export default AnnotationLayer; 