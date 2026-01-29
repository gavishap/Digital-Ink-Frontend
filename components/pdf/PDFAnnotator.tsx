'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';

interface PDFAnnotatorProps {
  pdfUrl: string;
  onSaveAndAnalyze: (pages: Blob[]) => void;
  isAnalyzing?: boolean;
}

export function PDFAnnotator({ pdfUrl, onSaveAndAnalyze, isAnalyzing = false }: PDFAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRefs = useRef<(fabric.Canvas | null)[]>([]);
  const [pageCount, setPageCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'select'>('pen');
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const [renderedPages, setRenderedPages] = useState<Set<number>>(new Set());

  // Load PDF.js
  useEffect(() => {
    const loadPdf = async () => {
      try {
        setIsLoading(true);
        const pdfjsLib = await import('pdfjs-dist');
        
        // Set worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        
        // Load the PDF
        const loadingTask = pdfjsLib.getDocument(pdfUrl);
        const pdf = await loadingTask.promise;
        
        setPdfDoc(pdf);
        setPageCount(pdf.numPages);
        canvasRefs.current = new Array(pdf.numPages).fill(null);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDF:', err);
        setError('Failed to load PDF');
        setIsLoading(false);
      }
    };

    loadPdf();
  }, [pdfUrl]);

  // Render current page
  useEffect(() => {
    if (!pdfDoc || !containerRef.current || renderedPages.has(currentPage)) return;

    const renderPage = async () => {
      try {
        const page = await pdfDoc.getPage(currentPage);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        // Create container for this page
        const pageContainer = document.getElementById(`page-container-${currentPage}`);
        if (!pageContainer) return;

        // Clear existing content
        pageContainer.innerHTML = '';

        // Create PDF canvas
        const pdfCanvas = document.createElement('canvas');
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        pdfCanvas.style.position = 'absolute';
        pdfCanvas.style.left = '0';
        pdfCanvas.style.top = '0';
        
        const ctx = pdfCanvas.getContext('2d');
        if (!ctx) return;

        // Render PDF page
        await page.render({
          canvasContext: ctx,
          viewport: viewport,
        }).promise;

        // Create annotation canvas on top
        const annotationCanvas = document.createElement('canvas');
        annotationCanvas.id = `annotation-canvas-${currentPage}`;
        annotationCanvas.width = viewport.width;
        annotationCanvas.height = viewport.height;
        annotationCanvas.style.position = 'absolute';
        annotationCanvas.style.left = '0';
        annotationCanvas.style.top = '0';

        // Set container size
        pageContainer.style.width = `${viewport.width}px`;
        pageContainer.style.height = `${viewport.height}px`;
        pageContainer.style.position = 'relative';

        pageContainer.appendChild(pdfCanvas);
        pageContainer.appendChild(annotationCanvas);

        // Initialize Fabric.js canvas for annotations
        const fabricCanvas = new fabric.Canvas(annotationCanvas, {
          isDrawingMode: tool === 'pen',
          width: viewport.width,
          height: viewport.height,
        });

        fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
        fabricCanvas.freeDrawingBrush.color = brushColor;
        fabricCanvas.freeDrawingBrush.width = brushWidth;

        canvasRefs.current[currentPage - 1] = fabricCanvas;
        setRenderedPages(prev => new Set([...prev, currentPage]));
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
  }, [pdfDoc, currentPage, renderedPages]);

  // Update brush settings
  useEffect(() => {
    const canvas = canvasRefs.current[currentPage - 1];
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = tool === 'eraser' ? '#FFFFFF' : brushColor;
      canvas.freeDrawingBrush.width = tool === 'eraser' ? 20 : brushWidth;
      canvas.isDrawingMode = tool !== 'select';
    }
  }, [brushColor, brushWidth, tool, currentPage]);

  // Handle save and analyze
  const handleSaveAndAnalyze = useCallback(async () => {
    if (!pdfDoc) return;

    const pageBlobs: Blob[] = [];

    for (let i = 1; i <= pageCount; i++) {
      // Render this page if not already rendered
      const page = await pdfDoc.getPage(i);
      const scale = 1.5;
      const viewport = page.getViewport({ scale });

      // Create a combined canvas
      const combinedCanvas = document.createElement('canvas');
      combinedCanvas.width = viewport.width;
      combinedCanvas.height = viewport.height;
      const ctx = combinedCanvas.getContext('2d');
      if (!ctx) continue;

      // Render PDF page
      await page.render({
        canvasContext: ctx,
        viewport: viewport,
      }).promise;

      // Overlay annotations if they exist
      const fabricCanvas = canvasRefs.current[i - 1];
      if (fabricCanvas) {
        const annotationDataUrl = fabricCanvas.toDataURL({
          format: 'png',
          multiplier: 1,
        });
        
        const annotationImg = new Image();
        await new Promise<void>((resolve) => {
          annotationImg.onload = () => {
            ctx.drawImage(annotationImg, 0, 0);
            resolve();
          };
          annotationImg.src = annotationDataUrl;
        });
      }

      // Convert to blob
      const blob = await new Promise<Blob>((resolve) => {
        combinedCanvas.toBlob((b) => resolve(b!), 'image/png', 0.95);
      });
      
      pageBlobs.push(blob);
    }

    onSaveAndAnalyze(pageBlobs);
  }, [pdfDoc, pageCount, onSaveAndAnalyze]);

  // Clear current page annotations
  const handleClear = () => {
    const canvas = canvasRefs.current[currentPage - 1];
    if (canvas) {
      canvas.clear();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading PDF...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-4">
          {/* Logo */}
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-600 rounded-lg">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="font-semibold text-gray-900">Digital Ink</span>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Drawing Tools */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setTool('pen')}
              className={`p-2 rounded-lg ${tool === 'pen' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Pen"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </button>
            <button
              onClick={() => setTool('eraser')}
              className={`p-2 rounded-lg ${tool === 'eraser' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Eraser"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
            <button
              onClick={() => setTool('select')}
              className={`p-2 rounded-lg ${tool === 'select' ? 'bg-blue-100 text-blue-600' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Select"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </button>
          </div>

          <div className="h-6 w-px bg-gray-300"></div>

          {/* Color Picker */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Color:</label>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>

          {/* Brush Width */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Size:</label>
            <input
              type="range"
              min="1"
              max="10"
              value={brushWidth}
              onChange={(e) => setBrushWidth(Number(e.target.value))}
              className="w-20"
            />
          </div>

          <button
            onClick={handleClear}
            className="px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded-lg"
          >
            Clear Page
          </button>
        </div>

        {/* Save & Analyze Button */}
        <button
          onClick={handleSaveAndAnalyze}
          disabled={isAnalyzing}
          className={`
            px-6 py-2 rounded-lg font-medium text-white flex items-center space-x-2
            ${isAnalyzing ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
          `}
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>Analyzing...</span>
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Save & Analyze</span>
            </>
          )}
        </button>
      </div>

      {/* Page Navigation */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-center space-x-4">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span className="text-sm font-medium text-gray-700">
          Page {currentPage} of {pageCount}
        </span>
        <button
          onClick={() => setCurrentPage(Math.min(pageCount, currentPage + 1))}
          disabled={currentPage === pageCount}
          className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* PDF Canvas Area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200 p-4 flex justify-center">
        <div className="bg-white shadow-lg">
          <div id={`page-container-${currentPage}`} className="relative"></div>
        </div>
      </div>
    </div>
  );
}
