'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as fabric from 'fabric';
import { PDFDocument } from 'pdf-lib';

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

interface AnnotatedPdf {
  documentId: string;
  documentName: string;
  blob: Blob;
}

interface SaveAndAnalyzeData {
  annotatedPages: Map<string, AnnotatedPage[]>;  // For AI analysis (only pages with annotations)
  completePdfs: AnnotatedPdf[];                   // Complete documents with all pages + annotations
}

interface MultiDocumentAnnotatorProps {
  documents: DocumentConfig[];
  onSaveAndAnalyze: (data: SaveAndAnalyzeData) => void;
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

  // Undo last stroke/object
  const handleUndo = () => {
    if (!currentDocState) return;
    const pageData = currentDocState.pageData[currentDocState.currentPage - 1];
    const canvas = pageData?.fabricCanvas;
    if (canvas) {
      const objects = canvas.getObjects();
      if (objects.length > 0) {
        canvas.remove(objects[objects.length - 1]);
        canvas.renderAll();
      }
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

  // Helper function to render a page with annotations to a canvas
  const renderPageWithAnnotations = async (
    pdfDoc: any,
    pageNumber: number,
    pageData: PageData | null,
    scale: number = 1.5,
  ): Promise<HTMLCanvasElement> => {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });

    const combinedCanvas = document.createElement('canvas');
    combinedCanvas.width = viewport.width;
    combinedCanvas.height = viewport.height;
    const ctx = combinedCanvas.getContext('2d')!;

    // Render PDF page
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Overlay annotations if present
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

    return combinedCanvas;
  };

  // Generate a complete PDF with all pages and annotations
  const generateCompletePdf = async (
    doc: DocumentConfig,
    docState: DocumentState,
  ): Promise<Blob> => {
    // Fetch the original PDF
    const originalPdfBytes = await fetch(doc.pdfUrl).then(res => res.arrayBuffer());
    const pdfLibDoc = await PDFDocument.load(originalPdfBytes);
    const pages = pdfLibDoc.getPages();

    // Process each page
    for (let i = 0; i < pages.length; i++) {
      const page = pages[i];
      const pageData = docState.pageData[i];
      
      // Only add annotation overlay if this page has annotations
      if (pageHasAnnotations(pageData)) {
        // Render the page with annotations to a canvas
        const canvas = await renderPageWithAnnotations(docState.pdfDoc, i + 1, pageData);
        
        // Convert canvas to PNG
        const pngDataUrl = canvas.toDataURL('image/png');
        const pngBytes = await fetch(pngDataUrl).then(res => res.arrayBuffer());
        
        // Embed the image and draw it over the page
        const pngImage = await pdfLibDoc.embedPng(pngBytes);
        
        // Scale to fit page dimensions
        const pageWidth = page.getWidth();
        const pageHeight = page.getHeight();
        
        page.drawImage(pngImage, {
          x: 0,
          y: 0,
          width: pageWidth,
          height: pageHeight,
        });
      }
    }

    // Save the PDF
    const pdfBytes = await pdfLibDoc.save();
    return new Blob([pdfBytes], { type: 'application/pdf' });
  };

  // Save and analyze - generates both annotated pages for AI and complete PDFs for storage
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

    // 1. Generate annotated pages for AI analysis (only pages with annotations)
    const allDocumentPages = new Map<string, AnnotatedPage[]>();

    for (const doc of documents) {
      const docState = documentStates.get(doc.id);
      if (!docState) continue;

      const annotatedPages: AnnotatedPage[] = [];

      for (let i = 1; i <= docState.pageCount; i++) {
        const pageData = docState.pageData[i - 1];
        
        // Skip pages without annotations for AI analysis
        if (!pageHasAnnotations(pageData)) continue;

        const canvas = await renderPageWithAnnotations(docState.pdfDoc, i, pageData);
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png', 0.95);
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

    // 2. Generate complete PDFs with all pages + annotations for storage
    const completePdfs: AnnotatedPdf[] = [];

    for (const doc of documents) {
      const docState = documentStates.get(doc.id);
      if (!docState) continue;

      // Check if this document has any annotations
      const hasAnyAnnotations = docState.pageData.some(pd => pageHasAnnotations(pd));
      
      if (hasAnyAnnotations) {
        const pdfBlob = await generateCompletePdf(doc, docState);
        completePdfs.push({
          documentId: doc.id,
          documentName: doc.name,
          blob: pdfBlob,
        });
      }
    }

    // Pass both to the callback
    onSaveAndAnalyze({
      annotatedPages: allDocumentPages,
      completePdfs,
    });
  }, [documents, documentStates, activeDocId, currentDocState, onSaveAndAnalyze]);

  // Calculate total pages across all documents
  const totalPages = Array.from(documentStates.values()).reduce((sum, ds) => sum + ds.pageCount, 0);
  const currentGlobalPage = documents
    .slice(0, documents.findIndex(d => d.id === activeDocId))
    .reduce((sum, d) => sum + (documentStates.get(d.id)?.pageCount || 0), 0) + (currentDocState?.currentPage || 0);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-stone-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-amber-600 border-t-transparent animate-spin"></div>
          </div>
          <p className="text-lg font-light tracking-wide text-stone-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100">
        <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-10 shadow-xl shadow-stone-200/50 border border-stone-200/50">
          <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-red-50 flex items-center justify-center">
            <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <p className="text-lg font-medium text-stone-800">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-stone-100 via-amber-50/20 to-stone-100">
      
      {/* ═══════════════════════════════════════════════════════════════════════════
          HEADER - Refined toolbar with elegant spacing
      ═══════════════════════════════════════════════════════════════════════════ */}
      <header className="bg-white/95 backdrop-blur-md border-b border-stone-200/60 shadow-sm shadow-stone-200/30">
        <div className="px-6 py-4 flex items-center justify-between">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 shadow-lg shadow-amber-500/25 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold tracking-tight text-stone-800">Digital Ink</h1>
                <p className="text-xs text-stone-400 font-medium tracking-wide">Patient Intake System</p>
              </div>
            </div>

            {/* Divider */}
            <div className="h-10 w-px bg-gradient-to-b from-transparent via-stone-300 to-transparent"></div>

            {/* ─────────────────────────────────────────────────────────────────────
                DRAWING TOOLS - Sliding selector with animation
            ───────────────────────────────────────────────────────────────────── */}
            <div className="flex items-center gap-10">
              {/* Tool Buttons with Sliding Indicator */}
              <div className="relative flex items-center bg-stone-100 rounded-2xl p-1.5">
                {/* Sliding background - positioned absolutely */}
                <div 
                  className="absolute top-1.5 bottom-1.5 bg-white rounded-xl shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/40 transition-all duration-300 ease-out"
                  style={{
                    width: '120px',
                    transform: tool === 'pen' 
                      ? 'translateX(0px)' 
                      : tool === 'eraser' 
                        ? 'translateX(124px)' 
                        : 'translateX(248px)',
                  }}
                />
                
                <button
                  onClick={() => setTool('pen')}
                  className={`relative z-10 flex items-center justify-center gap-4 w-[120px] py-4 rounded-xl font-semibold text-sm transition-colors duration-200 ${
                    tool === 'pen' 
                      ? 'text-amber-600' 
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Pen</span>
                </button>
                
                <button
                  onClick={() => setTool('eraser')}
                  className={`relative z-10 flex items-center justify-center gap-4 w-[120px] py-4 rounded-xl font-semibold text-sm transition-colors duration-200 ${
                    tool === 'eraser' 
                      ? 'text-amber-600' 
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                  </svg>
                  <span>Eraser</span>
                </button>
                
                <button
                  onClick={() => setTool('select')}
                  className={`relative z-10 flex items-center justify-center gap-4 w-[120px] py-4 rounded-xl font-semibold text-sm transition-colors duration-200 ${
                    tool === 'select' 
                      ? 'text-amber-600' 
                      : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                  </svg>
                  <span>Select</span>
                </button>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-stone-200"></div>

              {/* Color Picker */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Color</span>
                <div className="relative group">
                  <input
                    type="color"
                    value={brushColor}
                    onChange={(e) => setBrushColor(e.target.value)}
                    className="w-10 h-10 rounded-xl cursor-pointer border-2 border-stone-200 hover:border-amber-400 transition-all duration-200 hover:scale-105"
                    style={{ backgroundColor: brushColor }}
                  />
                  <div className="absolute inset-0 rounded-xl ring-2 ring-white pointer-events-none"></div>
                </div>
              </div>

              {/* Size Slider */}
              <div className="flex items-center gap-4">
                <span className="text-xs font-bold uppercase tracking-widest text-stone-400">Size</span>
                <div className="flex items-center gap-3 bg-stone-100 rounded-xl px-4 py-2">
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={brushWidth}
                    onChange={(e) => setBrushWidth(Number(e.target.value))}
                    className="w-28 h-2 bg-stone-300 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-br [&::-webkit-slider-thumb]:from-amber-400 [&::-webkit-slider-thumb]:to-amber-600 [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-amber-500/30 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
                  />
                  <span className="text-sm font-bold text-stone-600 w-6 text-center">{brushWidth}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-stone-200"></div>

              {/* Undo Button */}
              <button
                onClick={handleUndo}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-stone-500 hover:text-amber-600 bg-stone-100 hover:bg-amber-50 rounded-xl transition-all duration-200 hover:shadow-md"
                title="Undo last stroke"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                </svg>
                <span>Undo</span>
              </button>

              {/* Clear Button */}
              <button
                onClick={handleClear}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-stone-500 hover:text-red-600 bg-stone-100 hover:bg-red-50 rounded-xl transition-all duration-200 hover:shadow-md"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* ─────────────────────────────────────────────────────────────────────
              SAVE & ANALYZE BUTTON - Prominent CTA
          ───────────────────────────────────────────────────────────────────── */}
          <button
            onClick={handleSaveAndAnalyze}
            disabled={isAnalyzing}
            className={`group relative flex items-center gap-3 px-7 py-3 rounded-xl font-semibold text-white transition-all duration-300 ${
              isAnalyzing 
                ? 'bg-emerald-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5'
            }`}
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
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
      </header>

      {/* ═══════════════════════════════════════════════════════════════════════════
          DOCUMENT TABS - Elegant tab navigation
      ═══════════════════════════════════════════════════════════════════════════ */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-stone-200/40 px-6">
        <div className="flex gap-2 -mb-px">
          {documents.map((doc) => {
            const docState = documentStates.get(doc.id);
            const isActive = activeDocId === doc.id;
            return (
              <button
                key={doc.id}
                onClick={() => setActiveDocId(doc.id)}
                className={`group relative px-6 py-4 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'text-amber-700'
                    : 'text-stone-500 hover:text-stone-700'
                }`}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {doc.name}
                  {docState && (
                    <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                      isActive 
                        ? 'bg-amber-100 text-amber-700' 
                        : 'bg-stone-100 text-stone-400 group-hover:bg-stone-200'
                    }`}>
                      {docState.pageCount}
                    </span>
                  )}
                </span>
                {/* Active indicator */}
                <div className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-full transition-all duration-300 ${
                  isActive 
                    ? 'bg-gradient-to-r from-amber-400 to-amber-500' 
                    : 'bg-transparent group-hover:bg-stone-200'
                }`}></div>
              </button>
            );
          })}
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════════════════
          PAGE NAVIGATION - Clean pagination controls
      ═══════════════════════════════════════════════════════════════════════════ */}
      {currentDocState && (
        <div className="bg-white/60 backdrop-blur-sm border-b border-stone-200/40 px-6 py-3">
          <div className="flex items-center justify-center gap-6">
            {/* Previous Page */}
            <button
              onClick={() => goToPage(currentDocState.currentPage - 1)}
              disabled={currentDocState.currentPage === 1}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-stone-600 hover:text-stone-800 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="text-sm font-medium">Previous</span>
            </button>

            {/* Page Indicator */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-stone-200/60">
                <span className="text-sm font-semibold text-stone-800">
                  Page {currentDocState.currentPage}
                </span>
                <span className="text-stone-300">/</span>
                <span className="text-sm text-stone-500">
                  {currentDocState.pageCount}
                </span>
              </div>
              <div className="text-xs text-stone-400 font-medium">
                Overall: {currentGlobalPage} of {totalPages}
              </div>
            </div>

            {/* Next Page */}
            <button
              onClick={() => goToPage(currentDocState.currentPage + 1)}
              disabled={currentDocState.currentPage === currentDocState.pageCount}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-stone-600 hover:text-stone-800 hover:bg-stone-100 disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-all duration-200"
            >
              <span className="text-sm font-medium">Next</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════════
          PDF CANVAS AREA - Document viewing area with subtle styling
      ═══════════════════════════════════════════════════════════════════════════ */}
      <main 
        ref={containerRef} 
        className="flex-1 overflow-auto p-8 flex justify-center items-start"
        style={{
          background: 'linear-gradient(180deg, rgba(245,243,240,0.8) 0%, rgba(250,248,245,1) 100%)',
        }}
      >
        <div className="bg-white rounded-lg shadow-2xl shadow-stone-300/40 ring-1 ring-stone-200/50">
          <div id={`page-container-${activeDocId}`} className="relative"></div>
        </div>
      </main>
    </div>
  );
}
