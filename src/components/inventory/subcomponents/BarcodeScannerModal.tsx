'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, CheckCircle2, ScanLine } from 'lucide-react';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanSuccess: (decodedText: string) => void;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({
  isOpen,
  onClose,
  onScanSuccess,
}) => {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [lastScanned, setLastScanned] = useState<string | null>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'barcode-qr-reader-container';

  useEffect(() => {
    if (!isOpen) {
      cleanupScanner();
      setErrorMessage(null);
      setLastScanned(null);
      return;
    }

    let isMounted = true;

    const startScanner = async () => {
      try {
        setErrorMessage(null);
        // Small delay to ensure the container element is rendered in DOM
        await new Promise((resolve) => setTimeout(resolve, 150));

        if (!isMounted) return;

        const html5QrCode = new Html5Qrcode(scannerContainerId);
        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        };

        await html5QrCode.start(
          { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (isMounted) {
              setLastScanned(decodedText);
              // Play a light subtle feedback beep if audio is allowed
              try {
                const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.frequency.value = 880;
                gain.gain.value = 0.1;
                osc.start();
                setTimeout(() => {
                  osc.stop();
                  ctx.close();
                }, 100);
              } catch (_) {}

              // Auto-stop and close
              cleanupScanner();
              onScanSuccess(decodedText);
              onClose();
            }
          },
          () => {
            // Frame scan without match, ignore to avoid spamming console
          }
        );

        if (isMounted) {
          setIsScanning(true);
        }
      } catch (err: any) {
        console.error('Error starting html5-qrcode scanner:', err);
        if (isMounted) {
          setErrorMessage(
            err.name === 'NotAllowedError'
              ? 'No se concedieron permisos para acceder a la cámara. Por favor permítelos en tu navegador.'
              : 'No se pudo iniciar la cámara para el escaneo. Verifica que tu dispositivo cuente con una cámara conectada.'
          );
          setIsScanning(false);
        }
      }
    };

    startScanner();

    return () => {
      isMounted = false;
      cleanupScanner();
    };
  }, [isOpen]);

  const cleanupScanner = () => {
    if (scannerRef.current) {
      if (scannerRef.current.isScanning) {
        scannerRef.current.stop().catch(() => {}).finally(() => {
          try {
            scannerRef.current?.clear();
          } catch (_) {}
          scannerRef.current = null;
          setIsScanning(false);
        });
      } else {
        try {
          scannerRef.current.clear();
        } catch (_) {}
        scannerRef.current = null;
        setIsScanning(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-2xl w-full max-w-md overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-xl">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">
                Escanear Código / QR
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Apunta la cámara al código de barra o QR del producto
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scanner Viewer */}
        <div className="p-5 flex flex-col items-center justify-center bg-slate-50 relative min-h-[320px]">
          {errorMessage ? (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 flex flex-col items-center text-center gap-2 text-rose-700 text-xs max-w-sm">
              <AlertCircle className="w-6 h-6 text-rose-500" />
              <p className="font-semibold text-rose-950">Acceso a Cámara no Disponible</p>
              <p>{errorMessage}</p>
            </div>
          ) : (
            <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden shadow-inner border border-slate-200 flex items-center justify-center">
              <div id={scannerContainerId} className="w-full h-full" />
              {isScanning && (
                <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                  <div className="w-48 h-48 border-2 border-indigo-400/80 rounded-xl relative">
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)] animate-pulse" />
                  </div>
                  <span className="mt-3 text-[11px] font-semibold text-white/90 bg-black/60 px-3 py-1 rounded-full backdrop-blur-xs flex items-center gap-1.5">
                    <ScanLine className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                    Buscando código...
                  </span>
                </div>
              )}
            </div>
          )}

          {lastScanned && (
            <div className="mt-4 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 font-mono font-semibold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="truncate">Leído: {lastScanned}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-white shrink-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Compatible con QR, EAN-13, UPC y Code-128
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-all cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
