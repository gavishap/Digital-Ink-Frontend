'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';

interface DocumentConfig {
  id: string;
  name: string;
  pdfUrl: string;
}

interface AnnotatedPage {
  pageNumber: number;
  documentId: string;
  documentName: string;
  blob: Blob;
}

interface MultiDocumentAnnotatorProps {
  documents: DocumentConfig[];
  onSaveAndAnalyze: (documentPages: Map<string, AnnotatedPage[]>) => void;
  isAnalyzing?: boolean;
  analysisProgress?: { current: number; total: number; percentage: number; stage?: string };
}

interface PageData {
  fabricCanvas: fabric.Canvas | null;
  canvasJson: string | null;  // Store canvas state as JSON
  viewport: { width: number; height: number } | null;
}

interface DocumentState {
  pdfDoc: any;
  pageCount: number;
  currentPage: number;
  pageData: PageData[];
}

export function MultiDocumentAnnotator({
  documents,
  onSaveAndAnalyze,
  isAnalyzing = false,
  analysisProgress,
}: MultiDocumentAnnotatorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeDocId, setActiveDocId] = useState(documents[0]?.id || '');
  const [documentStates, setDocumentStates] = useState<Map<string, DocumentState>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'select'>('pen');
  // Track current page per doc to trigger re-renders
  const [renderKey, setRenderKey] = useState(0);

  // Load all PDFs
  useEffect(() => {
    const loadAllPdfs = async () => {
      try {
        setIsLoading(true);
        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const newStates = new Map<string, DocumentState>();

        for (const doc of documents) {
          const loadingTask = pdfjsLib.getDocument(doc.pdfUrl);
          const pdf = await loadingTask.promise;
          
          newStates.set(doc.id, {
            pdfDoc: pdf,
            pageCount: pdf.numPages,
            currentPage: 1,
            pageData: new Array(pdf.numPages).fill(null).map(() => ({
              fabricCanvas: null,
              canvasJson: null,
              viewport: null,
            })),
          });
        }

        setDocumentStates(newStates);
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading PDFs:', err);
        setError('Failed to load documents');
        setIsLoading(false);
      }
    };

    loadAllPdfs();
  }, [documents]);

  // Get current document state
  const currentDocState = documentStates.get(activeDocId);

  // Render current page of active document - runs whenever page or doc changes
  useEffect(() => {
    if (!currentDocState || !containerRef.current) return;

    const renderPage = async () => {
      try {
        const pageIndex = currentDocState.currentPage - 1;
        const pageContainer = document.getElementById(`page-container-${activeDocId}`);
        if (!pageContainer) return;

        // Save current fabric canvas state before switching (if exists)
        const existingFabricCanvas = currentDocState.pageData[pageIndex]?.fabricCanvas;
        if (existingFabricCanvas) {
          // Store the JSON state
          const jsonState = JSON.stringify(existingFabricCanvas.toJSON());
          setDocumentStates(prev => {
            const newStates = new Map(prev);
            const docState = newStates.get(activeDocId);
            if (docState) {
              docState.pageData[pageIndex].canvasJson = jsonState;
            }
            return newStates;
          });
        }

        // Clear the container
        pageContainer.innerHTML = '';

        // Render the PDF page
        const page = await currentDocState.pdfDoc.getPage(currentDocState.currentPage);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        // Create PDF canvas
        const pdfCanvas = document.createElement('canvas');
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        pdfCanvas.style.position = 'absolute';
        pdfCanvas.style.left = '0';
        pdfCanvas.style.top = '0';

        const ctx = pdfCanvas.getContext('2d');
        if (!ctx) return;

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Create annotation canvas
        const annotationCanvas = document.createElement('canvas');
        annotationCanvas.id = `annotation-canvas-${activeDocId}-${currentDocState.currentPage}`;
        annotationCanvas.width = viewport.width;
        annotationCanvas.height = viewport.height;
        annotationCanvas.style.position = 'absolute';
        annotationCanvas.style.left = '0';
        annotationCanvas.style.top = '0';

        pageContainer.style.width = `${viewport.width}px`;
        pageContainer.style.height = `${viewport.height}px`;
        pageContainer.style.position = 'relative';

        pageContainer.appendChild(pdfCanvas);
        pageContainer.appendChild(annotationCanvas);

        // Initialize Fabric canvas
        const fabricCanvas = new fabric.Canvas(annotationCanvas, {
          isDrawingMode: tool === 'pen',
          width: viewport.width,
          height: viewport.height,
        });

        fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
        fabricCanvas.freeDrawingBrush.color = tool === 'eraser' ? '#FFFFFF' : brushColor;
        fabricCanvas.freeDrawingBrush.width = tool === 'eraser' ? 20 : brushWidth;

        // Restore previous canvas state if exists
        const savedJson = currentDocState.pageData[pageIndex]?.canvasJson;
        if (savedJson) {
          fabricCanvas.loadFromJSON(savedJson, () => {
            fabricCanvas.renderAll();
          });
        }

        // Update state with new canvas reference
        setDocumentStates(prev => {
          const newStates = new Map(prev);
          const docState = newStates.get(activeDocId);
          if (docState) {
            docState.pageData[pageIndex] = {
              fabricCanvas,
              canvasJson: savedJson || null,
              viewport: { width: viewport.width, height: viewport.height },
            };
          }
          return newStates;
        });
      } catch (err) {
        console.error('Error rendering page:', err);
      }
    };

    renderPage();
  }, [activeDocId, currentDocState?.currentPage, renderKey]);

  // Update brush settings for current canvas
  useEffect(() => {
    if (!currentDocState) return;
    const pageData = currentDocState.pageData[currentDocState.currentPage - 1];
    const canvas = pageData?.fabricCanvas;
    if (canvas && canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.color = tool === 'eraser' ? '#FFFFFF' : brushColor;
      canvas.freeDrawingBrush.width = tool === 'eraser' ? 20 : brushWidth;
      canvas.isDrawingMode = tool !== 'select';
    }
  }, [brushColor, brushWidth, tool, currentDocState]);

  // Navigate to page - save current canvas state before switching
  const goToPage = useCallback((pageNum: number) => {
    if (!currentDocState) return;
    
    const currentPageIndex = currentDocState.currentPage - 1;
    const currentCanvas = currentDocState.pageData[currentPageIndex]?.fabricCanvas;
    
    // Save current canvas state before switching
    if (currentCanvas) {
      const jsonState = JSON.stringify(currentCanvas.toJSON());
      setDocumentStates(prev => {
        const newStates = new Map(prev);
        const docState = newStates.get(activeDocId);
        if (docState) {
          docState.pageData[currentPageIndex].canvasJson = jsonState;
          docState.currentPage = Math.max(1, Math.min(pageNum, docState.pageCount));
        }
        return newStates;
      });
    } else {
      setDocumentStates(prev => {
        const newStates = new Map(prev);
        const docState = newStates.get(activeDocId);
        if (docState) {
          docState.currentPage = Math.max(1, Math.min(pageNum, docState.pageCount));
        }
        return newStates;
      });
    }
    
    // Force re-render
    setRenderKey(prev => prev + 1);
  }, [activeDocId, currentDocState]);

  // Clear current page
  const handleClear = () => {
    if (!currentDocState) return;
    const pageData = currentDocState.pageData[currentDocState.currentPage - 1];
    const canvas = pageData?.fabricCanvas;
    if (canvas) {
      canvas.clear();
    }
  };

  // Check if a page has any annotations
  const pageHasAnnotations = (pageData: PageData | null): boolean => {
    if (!pageData) return false;
    
    // Check active canvas
    if (pageData.fabricCanvas) {
      return pageData.fabricCanvas.getObjects().length > 0;
    }
    
    // Check saved JSON state
    if (pageData.canvasJson) {
      try {
        const parsed = JSON.parse(pageData.canvasJson);
        return parsed.objects && parsed.objects.length > 0;
      } catch {
        return false;
      }
    }
    
    return false;
  };

  // Save and analyze only pages with annotations
  const handleSaveAndAnalyze = useCallback(async () => {
    // First, save the current page's canvas state
    if (currentDocState) {
      const currentPageIndex = currentDocState.currentPage - 1;
      const currentCanvas = currentDocState.pageData[currentPageIndex]?.fabricCanvas;
      if (currentCanvas) {
        const jsonState = JSON.stringify(currentCanvas.toJSON());
        setDocumentStates(prev => {
          const newStates = new Map(prev);
          const docState = newStates.get(activeDocId);
          if (docState) {
            docState.pageData[currentPageIndex].canvasJson = jsonState;
          }
          return newStates;
        });
      }
    }

    const allDocumentPages = new Map<string, AnnotatedPage[]>();

    for (const doc of documents) {
      const docState = documentStates.get(doc.id);
      if (!docState) continue;

      const annotatedPages: AnnotatedPage[] = [];

      for (let i = 1; i <= docState.pageCount; i++) {
        const pageData = docState.pageData[i - 1];
        
        // Skip pages without annotations
        if (!pageHasAnnotations(pageData)) continue;

        const page = await docState.pdfDoc.getPage(i);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const combinedCanvas = document.createElement('canvas');
        combinedCanvas.width = viewport.width;
        combinedCanvas.height = viewport.height;
        const ctx = combinedCanvas.getContext('2d');
        if (!ctx) continue;

        await page.render({ canvasContext: ctx, viewport }).promise;

        // Overlay annotations from saved state or current canvas
        if (pageData?.fabricCanvas) {
          const annotationDataUrl = pageData.fabricCanvas.toDataURL({ format: 'png', multiplier: 1 });
          const annotationImg = new Image();
          await new Promise<void>((resolve) => {
            annotationImg.onload = () => {
              ctx.drawImage(annotationImg, 0, 0);
              resolve();
            };
            annotationImg.src = annotationDataUrl;
          });
        } else if (pageData?.canvasJson) {
          // If we have saved JSON state but no active canvas, create a temp canvas
          const tempCanvas = document.createElement('canvas');
          tempCanvas.width = viewport.width;
          tempCanvas.height = viewport.height;
          const tempFabric = new fabric.Canvas(tempCanvas, {
            width: viewport.width,
            height: viewport.height,
          });
          await new Promise<void>((resolve) => {
            tempFabric.loadFromJSON(pageData.canvasJson, () => {
              const annotationDataUrl = tempFabric.toDataURL({ format: 'png', multiplier: 1 });
              const annotationImg = new Image();
              annotationImg.onload = () => {
                ctx.drawImage(annotationImg, 0, 0);
                tempFabric.dispose();
                resolve();
              };
              annotationImg.src = annotationDataUrl;
            });
          });
        }

        const blob = await new Promise<Blob>((resolve) => {
          combinedCanvas.toBlob((b) => resolve(b!), 'image/png', 0.95);
        });
        
        annotatedPages.push({ 
          pageNumber: i, 
          documentId: doc.id,
          documentName: doc.name,
          blob 
        });
      }

      if (annotatedPages.length > 0) {
        allDocumentPages.set(doc.id, annotatedPages);
      }
    }

    onSaveAndAnalyze(allDocumentPages);
  }, [documents, documentStates, activeDocId, currentDocState, onSaveAndAnalyze]);

  // Calculate total pages across all documents
  const totalPages = Array.from(documentStates.values()).reduce((sum, ds) => sum + ds.pageCount, 0);
  const currentGlobalPage = documents
    .slice(0, documents.findIndex(d => d.id === activeDocId))
    .reduce((sum, d) => sum + (documentStates.get(d.id)?.pageCount || 0), 0) + (currentDocState?.currentPage || 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-lg font-medium text-gray-700">Loading documents...</p>
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
      {/* Top Toolbar */}
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

          {/* Color & Size */}
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">Color:</label>
            <input
              type="color"
              value={brushColor}
              onChange={(e) => setBrushColor(e.target.value)}
              className="w-8 h-8 rounded cursor-pointer"
            />
          </div>
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
          className={`px-6 py-2 rounded-lg font-medium text-white flex items-center space-x-2 ${
            isAnalyzing ? 'bg-green-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
          }`}
        >
          {isAnalyzing ? (
            <>
              <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span>
                {analysisProgress 
                  ? `Analyzing... ${analysisProgress.percentage}%`
                  : 'Preparing...'}
              </span>
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

      {/* Document Tabs */}
      <div className="bg-white border-b border-gray-200 px-4">
        <div className="flex space-x-1">
          {documents.map((doc) => {
            const docState = documentStates.get(doc.id);
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  activeDocId === doc.id
                    ? 'border-blue-600 text-blue-600 bg-blue-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                {doc.name}
                {docState && (
                  <span className="ml-2 text-xs text-gray-400">
                    ({docState.pageCount} pages)
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Page Navigation */}
      {currentDocState && (
        <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-center space-x-4">
          <button
            onClick={() => goToPage(currentDocState.currentPage - 1)}
            disabled={currentDocState.currentPage === 1}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-sm font-medium text-gray-700">
            Page {currentDocState.currentPage} of {currentDocState.pageCount}
            <span className="text-gray-400 ml-2">
              (Overall: {currentGlobalPage} of {totalPages})
            </span>
          </span>
          <button
            onClick={() => goToPage(currentDocState.currentPage + 1)}
            disabled={currentDocState.currentPage === currentDocState.pageCount}
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      )}

      {/* PDF Canvas Area */}
      <div ref={containerRef} className="flex-1 overflow-auto bg-gray-200 p-4 flex justify-center">
        <div className="bg-white shadow-lg">
          <div id={`page-container-${activeDocId}`} className="relative"></div>
        </div>
      </div>
    </div>
  );
}
