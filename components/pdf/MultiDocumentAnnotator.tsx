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
  annotatedPages: Map<string, AnnotatedPage[]>;
  completePdfs: AnnotatedPdf[];
}

interface MultiDocumentAnnotatorProps {
  documents: DocumentConfig[];
  onSaveAndAnalyze: (data: SaveAndAnalyzeData) => void;
  isAnalyzing?: boolean;
  analysisProgress?: { current: number; total: number; percentage: number; stage?: string };
}

interface PageData {
  fabricCanvas: fabric.Canvas | null;
  canvasJson: string | null;
  viewport: { width: number; height: number } | null;
}

interface DocumentState {
  pdfDoc: any;
  pageCount: number;
  pageData: PageData[];
}

// Tracks which pages have been rendered to avoid re-rendering
const renderedPagesRef = { current: new Set<string>() };

export function MultiDocumentAnnotator({
  documents,
  onSaveAndAnalyze,
  isAnalyzing = false,
  analysisProgress,
}: MultiDocumentAnnotatorProps) {
  const [activeDocId, setActiveDocId] = useState(documents[0]?.id || '');
  const [documentStates, setDocumentStates] = useState<Map<string, DocumentState>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brushColor, setBrushColor] = useState('#000000');
  const [brushWidth, setBrushWidth] = useState(2);
  const [tool, setTool] = useState<'pen' | 'eraser' | 'select'>('pen');

  const canvasJsonRef = useRef<Map<string, Map<number, string>>>(new Map());
  const fabricCanvasesRef = useRef<Map<string, fabric.Canvas>>(new Map());
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Load all PDFs
  useEffect(() => {
    const loadAllPdfs = async () => {
      try {
        setIsLoading(true);
        renderedPagesRef.current = new Set();
        fabricCanvasesRef.current = new Map();

        const pdfjsLib = await import('pdfjs-dist');
        pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

        const newStates = new Map<string, DocumentState>();
        for (const doc of documents) {
          const pdf = await pdfjsLib.getDocument(doc.pdfUrl).promise;
          newStates.set(doc.id, {
            pdfDoc: pdf,
            pageCount: pdf.numPages,
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

  // Render all pages for the active doc after states are loaded
  useEffect(() => {
    if (isLoading) return;
    const docState = documentStates.get(activeDocId);
    if (!docState) return;

    const renderAllPages = async () => {
      for (let pageNum = 1; pageNum <= docState.pageCount; pageNum++) {
        const pageKey = `${activeDocId}-${pageNum}`;
        if (renderedPagesRef.current.has(pageKey)) continue;

        const container = document.getElementById(`page-slot-${activeDocId}-${pageNum}`);
        if (!container) continue;
        if (container.children.length > 0) continue;

        renderedPagesRef.current.add(pageKey);

        const pageIndex = pageNum - 1;
        const page = await docState.pdfDoc.getPage(pageNum);
        const scale = 1.5;
        const viewport = page.getViewport({ scale });

        const pdfCanvas = document.createElement('canvas');
        pdfCanvas.width = viewport.width;
        pdfCanvas.height = viewport.height;
        pdfCanvas.style.position = 'absolute';
        pdfCanvas.style.left = '0';
        pdfCanvas.style.top = '0';
        await page.render({ canvasContext: pdfCanvas.getContext('2d')!, viewport }).promise;

        const annotationCanvas = document.createElement('canvas');
        annotationCanvas.width = viewport.width;
        annotationCanvas.height = viewport.height;
        annotationCanvas.style.position = 'absolute';
        annotationCanvas.style.left = '0';
        annotationCanvas.style.top = '0';

        container.style.width = `${viewport.width}px`;
        container.style.height = `${viewport.height}px`;
        container.style.position = 'relative';
        container.appendChild(pdfCanvas);
        container.appendChild(annotationCanvas);

        const fabricCanvas = new fabric.Canvas(annotationCanvas, {
          isDrawingMode: tool === 'pen',
          width: viewport.width,
          height: viewport.height,
        });
        fabricCanvas.freeDrawingBrush = new fabric.PencilBrush(fabricCanvas);
        fabricCanvas.freeDrawingBrush.color = tool === 'eraser' ? '#FFFFFF' : brushColor;
        fabricCanvas.freeDrawingBrush.width = tool === 'eraser' ? 20 : brushWidth;

        fabricCanvasesRef.current.set(pageKey, fabricCanvas);

        const savedJson = canvasJsonRef.current.get(activeDocId)?.get(pageIndex);
        if (savedJson) {
          try {
            const jsonData = JSON.parse(savedJson);
            const result = fabricCanvas.loadFromJSON(jsonData);
            if (result && typeof result.then === 'function') {
              result.then(() => fabricCanvas.renderAll());
            }
          } catch (e) {
            console.error('Error restoring canvas:', e);
          }
        }

        const saveState = () => {
          const json = JSON.stringify(fabricCanvas.toJSON());
          if (!canvasJsonRef.current.has(activeDocId)) {
            canvasJsonRef.current.set(activeDocId, new Map());
          }
          canvasJsonRef.current.get(activeDocId)!.set(pageIndex, json);
          setDocumentStates(prev => {
            const next = new Map(prev);
            const ds = next.get(activeDocId);
            if (ds?.pageData[pageIndex]) ds.pageData[pageIndex].canvasJson = json;
            return next;
          });
        };

        fabricCanvas.on('path:created', saveState);
        fabricCanvas.on('object:modified', saveState);
        fabricCanvas.on('object:removed', saveState);

        setDocumentStates(prev => {
          const next = new Map(prev);
          const ds = next.get(activeDocId);
          if (ds) {
            ds.pageData[pageIndex] = {
              fabricCanvas,
              canvasJson: savedJson || null,
              viewport: { width: viewport.width, height: viewport.height },
            };
          }
          return next;
        });
      }
    };

    renderAllPages();
  }, [isLoading, activeDocId, documentStates.size]);

  // Sync brush/tool to all active canvases
  useEffect(() => {
    const docState = documentStates.get(activeDocId);
    if (!docState) return;
    for (let i = 1; i <= docState.pageCount; i++) {
      const fc = fabricCanvasesRef.current.get(`${activeDocId}-${i}`);
      if (!fc) continue;
      if (fc.freeDrawingBrush) {
        fc.freeDrawingBrush.color = tool === 'eraser' ? '#FFFFFF' : brushColor;
        fc.freeDrawingBrush.width = tool === 'eraser' ? 20 : brushWidth;
      }
      fc.isDrawingMode = tool !== 'select';
    }
  }, [brushColor, brushWidth, tool, activeDocId, documentStates]);

  // When switching tabs, reset rendered state for that doc so pages re-render into new DOM nodes
  const handleTabSwitch = useCallback((docId: string) => {
    if (docId === activeDocId) return;
    // Clear rendered flags for new doc so they get rendered fresh
    const newDocState = documentStates.get(docId);
    if (newDocState) {
      for (let i = 1; i <= newDocState.pageCount; i++) {
        renderedPagesRef.current.delete(`${docId}-${i}`);
      }
    }
    setActiveDocId(docId);
  }, [activeDocId, documentStates]);

  const handleClear = () => {
    const docState = documentStates.get(activeDocId);
    if (!docState) return;
    // Clear all canvases in the active doc
    for (let i = 1; i <= docState.pageCount; i++) {
      fabricCanvasesRef.current.get(`${activeDocId}-${i}`)?.clear();
    }
  };

  const handleUndo = () => {
    // Undo on whatever canvas is closest to viewport center
    const docState = documentStates.get(activeDocId);
    if (!docState) return;
    // Find canvas with objects and remove from last one that has any
    for (let i = docState.pageCount; i >= 1; i--) {
      const fc = fabricCanvasesRef.current.get(`${activeDocId}-${i}`);
      if (fc) {
        const objs = fc.getObjects();
        if (objs.length > 0) {
          fc.remove(objs[objs.length - 1]);
          fc.renderAll();
          break;
        }
      }
    }
  };

  const renderPageWithAnnotations = async (
    pdfDoc: any,
    pageNumber: number,
    docId: string,
    pageData: PageData | null,
    scale = 1.5,
  ): Promise<HTMLCanvasElement> => {
    const page = await pdfDoc.getPage(pageNumber);
    const viewport = page.getViewport({ scale });
    const combined = document.createElement('canvas');
    combined.width = viewport.width;
    combined.height = viewport.height;
    const ctx = combined.getContext('2d')!;
    await page.render({ canvasContext: ctx, viewport }).promise;

    // Use live fabric canvas from ref if available
    const liveCanvas = fabricCanvasesRef.current.get(`${docId}-${pageNumber}`);
    if (liveCanvas) {
      const url = liveCanvas.toDataURL({ format: 'png', multiplier: 1 });
      const img = new Image();
      await new Promise<void>(resolve => {
        img.onload = () => { ctx.drawImage(img, 0, 0); resolve(); };
        img.src = url;
      });
    } else if (pageData?.canvasJson) {
      const tempEl = document.createElement('canvas');
      tempEl.width = viewport.width;
      tempEl.height = viewport.height;
      const tempFabric = new fabric.Canvas(tempEl, { width: viewport.width, height: viewport.height });
      await new Promise<void>(resolve => {
        tempFabric.loadFromJSON(JSON.parse(pageData.canvasJson!), () => {
          const url = tempFabric.toDataURL({ format: 'png', multiplier: 1 });
          const img = new Image();
          img.onload = () => { ctx.drawImage(img, 0, 0); tempFabric.dispose(); resolve(); };
          img.src = url;
        });
      });
    }
    return combined;
  };

  const generateCompletePdf = async (doc: DocumentConfig, docState: DocumentState): Promise<Blob> => {
    const originalBytes = await fetch(doc.pdfUrl).then(r => r.arrayBuffer());
    const pdfLibDoc = await PDFDocument.load(originalBytes);
    const pages = pdfLibDoc.getPages();
    for (let i = 0; i < pages.length; i++) {
      const pageData = docState.pageData[i];
      if (pageData?.fabricCanvas || pageData?.canvasJson) {
        const canvas = await renderPageWithAnnotations(docState.pdfDoc, i + 1, doc.id, pageData);
        const pngBytes = await fetch(canvas.toDataURL('image/png')).then(r => r.arrayBuffer());
        const pngImage = await pdfLibDoc.embedPng(pngBytes);
        const p = pages[i];
        p.drawImage(pngImage, { x: 0, y: 0, width: p.getWidth(), height: p.getHeight() });
      }
    }
    return new Blob([await pdfLibDoc.save() as BlobPart], { type: 'application/pdf' });
  };

  const handleSaveAndAnalyze = useCallback(async () => {
    const allDocumentPages = new Map<string, AnnotatedPage[]>();
    for (const doc of documents) {
      const docState = documentStates.get(doc.id);
      if (!docState) continue;
      const pages: AnnotatedPage[] = [];
      for (let i = 1; i <= docState.pageCount; i++) {
        const canvas = await renderPageWithAnnotations(docState.pdfDoc, i, doc.id, docState.pageData[i - 1]);
        const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/png', 0.95));
        pages.push({ pageNumber: i, documentId: doc.id, documentName: doc.name, blob });
      }
      if (pages.length > 0) allDocumentPages.set(doc.id, pages);
    }

    const completePdfs: AnnotatedPdf[] = [];
    for (const doc of documents) {
      const docState = documentStates.get(doc.id);
      if (!docState) continue;
      try {
        completePdfs.push({ documentId: doc.id, documentName: doc.name, blob: await generateCompletePdf(doc, docState) });
      } catch (err) {
        console.error(`PDF gen error for ${doc.name}:`, err);
      }
    }

    onSaveAndAnalyze({ annotatedPages: allDocumentPages, completePdfs });
  }, [documents, documentStates, onSaveAndAnalyze]);

  const totalPages = Array.from(documentStates.values()).reduce((s, ds) => s + ds.pageCount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100" style={{ height: 'calc(100vh - 56px)' }}>
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-stone-200" />
            <div className="absolute inset-0 rounded-full border-4 border-amber-600 border-t-transparent animate-spin" />
          </div>
          <p className="text-lg font-light tracking-wide text-stone-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center bg-gradient-to-br from-stone-100 via-amber-50/30 to-stone-100" style={{ height: 'calc(100vh - 56px)' }}>
        <div className="text-center bg-white/80 rounded-2xl p-10 shadow-xl border border-stone-200/50">
          <p className="text-lg font-medium text-stone-800">{error}</p>
        </div>
      </div>
    );
  }

  const activeDocState = documentStates.get(activeDocId);

  return (
    <div className="flex flex-col bg-stone-50" style={{ height: 'calc(100vh - 56px)' }}>

      {/* ── TOOLBAR ─────────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-stone-200 shrink-0">
        <div className="px-6 py-3 flex items-center justify-between">

          <div className="flex items-center gap-8">
            {/* Tool selector */}
            <div className="relative flex items-center bg-stone-100 rounded-xl p-1">
              <div
                className="absolute top-1 bottom-1 bg-white rounded-lg shadow shadow-stone-200 ring-1 ring-stone-200/80 transition-all duration-250 ease-out"
                style={{
                  width: '88px',
                  transform: tool === 'pen' ? 'translateX(0px)' : tool === 'eraser' ? 'translateX(92px)' : 'translateX(184px)',
                }}
              />
              {(['pen', 'eraser', 'select'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTool(t)}
                  className={`relative z-10 flex items-center justify-center gap-2 w-[88px] py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                    tool === t ? 'text-amber-600' : 'text-stone-400 hover:text-stone-600'
                  }`}
                >
                  {t === 'pen' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>}
                  {t === 'eraser' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" /></svg>}
                  {t === 'select' && <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" /></svg>}
                  <span className="capitalize">{t}</span>
                </button>
              ))}
            </div>

            <div className="h-6 w-px bg-stone-200" />

            {/* Color */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Color</span>
              <input
                type="color"
                value={brushColor}
                onChange={e => setBrushColor(e.target.value)}
                className="w-8 h-8 rounded-lg cursor-pointer border-2 border-stone-200 hover:border-amber-400 transition-colors"
              />
            </div>

            <div className="h-6 w-px bg-stone-200" />

            {/* Size */}
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-stone-400">Size</span>
              <input
                type="range" min="1" max="10" value={brushWidth}
                onChange={e => setBrushWidth(Number(e.target.value))}
                className="w-24 accent-amber-500 cursor-pointer"
              />
              <span className="text-sm font-semibold text-stone-600 w-4 text-center">{brushWidth}</span>
            </div>

            <div className="h-6 w-px bg-stone-200" />

            {/* Undo / Clear */}
            <button onClick={handleUndo} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
              Undo
            </button>
            <button onClick={handleClear} className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-stone-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Clear
            </button>
          </div>

          {/* Save & Analyze */}
          <button
            onClick={handleSaveAndAnalyze}
            disabled={isAnalyzing}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
              isAnalyzing
                ? 'bg-stone-100 text-stone-400 cursor-not-allowed'
                : 'bg-amber-500 text-white hover:bg-amber-600 shadow-sm shadow-amber-500/30 hover:shadow-md hover:shadow-amber-500/40'
            }`}
          >
            {isAnalyzing ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {analysisProgress ? `Analyzing... ${analysisProgress.percentage}%` : 'Preparing...'}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                Save & Analyze
              </>
            )}
          </button>
        </div>
      </header>

      {/* ── DOCUMENT TABS ───────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-stone-200 px-6 flex items-center gap-1 shrink-0">
        {documents.map(doc => {
          const ds = documentStates.get(doc.id);
          const active = activeDocId === doc.id;
          return (
            <button
              key={doc.id}
              onClick={() => handleTabSwitch(doc.id)}
              className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors duration-150 ${
                active ? 'text-amber-700' : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              {doc.name}
              {ds && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-amber-100 text-amber-700' : 'bg-stone-100 text-stone-400'}`}>
                  {ds.pageCount}
                </span>
              )}
              {active && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-amber-500 rounded-t-full" />}
            </button>
          );
        })}
        <span className="ml-auto text-xs text-stone-400 pr-1">{totalPages} total pages</span>
      </div>

      {/* ── SCROLLABLE PAGES ────────────────────────────────────────────────── */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto py-8 flex flex-col items-center gap-6"
        style={{ background: 'linear-gradient(180deg, #f5f3f0 0%, #faf8f5 100%)' }}
      >
        {activeDocState && Array.from({ length: activeDocState.pageCount }, (_, i) => i + 1).map(pageNum => (
          <div key={`${activeDocId}-${pageNum}`} className="flex flex-col items-center gap-2">
            {/* Page label */}
            <div className="text-xs font-medium text-stone-400 tracking-wide">
              Page {pageNum} of {activeDocState.pageCount}
            </div>
            {/* Page canvas slot */}
            <div
              className="bg-white shadow-xl shadow-stone-300/30 ring-1 ring-stone-200/60 rounded-sm overflow-hidden"
            >
              <div id={`page-slot-${activeDocId}-${pageNum}`} className="relative" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
