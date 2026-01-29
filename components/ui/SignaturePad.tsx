'use client';

import React, { useRef, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';

interface SignaturePadProps {
  onSave: (signature: string) => void;
  onClear: () => void;
  width?: number;
  height?: number;
}

export function SignaturePad({
  onSave,
  onClear,
  width = 600,
  height = 200,
}: SignaturePadProps) {
  const sigCanvas = useRef<SignatureCanvas>(null);

  const handleSave = () => {
    if (sigCanvas.current) {
      const dataUrl = sigCanvas.current.toDataURL('image/png');
      onSave(dataUrl);
    }
  };

  const handleClear = () => {
    sigCanvas.current?.clear();
    onClear();
  };

  return (
    <div className="w-full">
      <div className="border-2 border-gray-300 rounded-lg p-4 bg-white">
        <SignatureCanvas
          ref={sigCanvas}
          canvasProps={{
            className: 'signature-canvas w-full',
            style: {
              width: '100%',
              height: `${height}px`,
              touchAction: 'none', // CRITICAL: Prevents scroll while signing
            },
          }}
          penColor="#1a1a1a"
          minWidth={1.5}
          maxWidth={3}
        />
      </div>
      <div className="flex gap-4 mt-4">
        <button
          type="button"
          onClick={handleClear}
          className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 min-h-[48px]"
        >
          Clear
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 min-h-[48px]"
        >
          Accept Signature
        </button>
      </div>
    </div>
  );
}



