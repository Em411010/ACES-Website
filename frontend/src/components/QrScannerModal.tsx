import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { X, Camera, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface QrScannerModalProps {
  onScan: (value: string) => void;
  onClose: () => void;
}

export default function QrScannerModal({ onScan, onClose }: QrScannerModalProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [started, setStarted] = useState(false);
  const containerId = "qr-scanner-container";

  useEffect(() => {
    const scanner = new Html5Qrcode(containerId);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 260, height: 260 } },
        (decodedText) => {
          // QR value format: "ACES:{digitalIDHash}"
          const hash = decodedText.startsWith("ACES:")
            ? decodedText.slice(5)
            : decodedText;
          scanner.stop().catch(() => {});
          onScan(hash);
        },
        () => { /* ignore decode failures */ }
      )
      .then(() => setStarted(true))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (msg.toLowerCase().includes("permission")) {
          setError("Camera permission denied. Please allow camera access.");
        } else {
          setError("Could not start camera. Make sure no other app is using it.");
        }
      });

    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [onScan]);

  function handleRetry() {
    setError(null);
    if (scannerRef.current) {
      scannerRef.current
        .start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 260, height: 260 } },
          (decodedText) => {
            const hash = decodedText.startsWith("ACES:")
              ? decodedText.slice(5)
              : decodedText;
            scannerRef.current?.stop().catch(() => {});
            onScan(hash);
          },
          () => {}
        )
        .then(() => setStarted(true))
        .catch(() => setError("Could not start camera."));
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative bg-card border rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <div className="flex items-center gap-2">
            <Camera className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Scan Digital ID</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-muted transition-colors"
            aria-label="Close scanner"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Camera view */}
        <div className="relative bg-black">
          <div id={containerId} className="w-full" />

          {/* Crosshair overlay */}
          {started && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="relative w-[260px] h-[260px]">
                {/* Corner brackets */}
                <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-sm" />
                <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-sm" />
                <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-sm" />
                <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-sm" />
                {/* Scan line animation */}
                <span className="absolute left-1 right-1 h-0.5 bg-primary/70 animate-scan-line rounded-full" />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4">
          {error ? (
            <div className="space-y-3">
              <p className="text-sm text-destructive text-center">{error}</p>
              <Button size="sm" variant="outline" className="w-full gap-2" onClick={handleRetry}>
                <RefreshCw className="h-3.5 w-3.5" /> Retry
              </Button>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground text-center">
              Point the camera at a member's Digital ID QR code
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
