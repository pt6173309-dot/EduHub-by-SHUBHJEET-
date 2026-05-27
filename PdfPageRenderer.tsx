import React, { useState, useEffect, useRef } from 'react';
import { Loader2, AlertCircle } from 'lucide-react';

interface PdfPageRendererProps {
  pdfData: Uint8Array | null;
  pageNumber: number;
  scale?: number;
}

export const PdfPageRenderer: React.FC<PdfPageRendererProps> = ({ pdfData, pageNumber, scale }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pdfDoc, setPdfDoc] = useState<any>(null);
  const currentRenderTask = useRef<any>(null);

  // Load the PDF Document once pdfData changes
  useEffect(() => {
    if (!pdfData) {
      setPdfDoc(null);
      setErrorMsg("No question paper PDF uploaded.");
      return;
    }
    setLoading(true);
    setErrorMsg(null);

    const pdfjsLib = (window as any).pdfjsLib;
    if (!pdfjsLib) {
      setErrorMsg("PDF processing engine is loading. Please wait a moment...");
      setLoading(false);
      return;
    }

    try {
      // Create a fresh copy of the Uint8Array to prevent PDF.js from detaching the original ArrayBuffer in the Web Worker
      const pdfDataCopy = new Uint8Array(pdfData);
      const loadingTask = pdfjsLib.getDocument({ data: pdfDataCopy });
      loadingTask.promise.then((loadedDoc: any) => {
        setPdfDoc(loadedDoc);
        setLoading(false);
      }).catch((err: any) => {
        console.error("PDF.js loading task error:", err);
        setErrorMsg("Failed to open PDF document. Ensure it is a valid PDF.");
        setLoading(false);
      });
    } catch (e: any) {
      setErrorMsg("PDF reader crashed: " + e.message);
      setLoading(false);
    }
  }, [pdfData]);

  // Render the page whenever pdfDoc or pageNumber shifts
  useEffect(() => {
    if (!pdfDoc || !canvasRef.current || pageNumber < 1) return;
    const canvas = canvasRef.current;

    // Check bounds
    if (pageNumber > pdfDoc.numPages) {
      setErrorMsg(`Page ${pageNumber} exceeds PDF total pages (${pdfDoc.numPages}).`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);

    // Cancel active render task to prevent stacking multiple frames
    if (currentRenderTask.current) {
      currentRenderTask.current.cancel();
    }

    pdfDoc.getPage(pageNumber).then((page: any) => {
      const context = canvas.getContext('2d');
      if (!context) {
        setLoading(false);
        return;
      }

      // Render scale based on prop for visual density
      const viewport = page.getViewport({ scale: scale || 1.25 });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      const renderTask = page.render(renderContext);
      currentRenderTask.current = renderTask;

      renderTask.promise.then(() => {
        setLoading(false);
        currentRenderTask.current = null;
      }).catch((err: any) => {
        if (err.name !== 'RenderingCancelledException') {
          console.error("Error drawing on canvas:", err);
          setErrorMsg("Could not draw page.");
          setLoading(false);
        }
      });
    }).catch((err: any) => {
      console.error("getPage error:", err);
      setErrorMsg("Failed to load page: " + pageNumber);
      setLoading(false);
    });

    return () => {
      if (currentRenderTask.current) {
        currentRenderTask.current.cancel();
      }
    };
  }, [pdfDoc, pageNumber, scale]);

  return (
    <div className="relative w-full h-full flex flex-col items-center bg-slate-950 p-4 border border-slate-800 rounded-2xl overflow-auto select-none custom-scrollbar">
      {loading && (
        <div className="absolute inset-x-0 top-0 h-1 bg-cyber-blue/20 overflow-hidden z-10">
          <div className="w-full h-full bg-cyber-blue animate-pulse" style={{ animationDuration: '1.5s' }} />
        </div>
      )}

      {errorMsg ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-500 space-y-3">
          <AlertCircle className="w-8 h-8 text-slate-600" />
          <p className="text-xs font-mono uppercase tracking-widest">{errorMsg}</p>
        </div>
      ) : (
        <div className="flex justify-center w-full min-w-[300px]">
          <canvas 
            ref={canvasRef} 
            className="shadow-2xl border border-slate-800 rounded-lg bg-white" 
            style={{ width: '100%', height: 'auto', maxWidth: '800px' }} 
          />
        </div>
      )}
    </div>
  );
};
