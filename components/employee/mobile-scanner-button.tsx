"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ScanLine, X } from "lucide-react";
import type { IScannerControls } from "@zxing/browser";
import { usePathname, useRouter } from "next/navigation";

function dispatchProductScan(value: string) {
  window.dispatchEvent(
    new CustomEvent("employee-product-scan", {
      detail: value.trim(),
    })
  );
}

export function MobileScannerButton() {
  const pathname = usePathname();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const scannedRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopScanner = useCallback(() => {
    controlsRef.current?.stop();
    controlsRef.current = null;
  }, []);

  const closeScanner = useCallback(() => {
    stopScanner();
    setIsOpen(false);
    setIsStarting(false);
    setError(null);
  }, [stopScanner]);

  const handleScanValue = useCallback(
    (value: string) => {
      if (!value.trim() || scannedRef.current) {
        return;
      }

      scannedRef.current = true;
      if (pathname === "/employee/billing") {
        dispatchProductScan(value);
      } else {
        router.push(`/employee/billing?scan=${encodeURIComponent(value.trim())}`);
      }
      closeScanner();
    },
    [closeScanner, pathname, router]
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    let isMounted = true;
    async function startScanner() {
      if (!videoRef.current) {
        return;
      }

      try {
        const { BrowserQRCodeReader } = await import("@zxing/browser");
        const reader = new BrowserQRCodeReader();
        const controls = await reader.decodeFromConstraints(
          {
            audio: false,
            video: {
              facingMode: { ideal: "environment" },
            },
          },
          videoRef.current,
          (result) => {
            const text = result?.getText();

            if (text) {
              handleScanValue(text);
            }
          }
        );

        if (!isMounted) {
          controls.stop();
          return;
        }

        controlsRef.current = controls;
        setIsStarting(false);
      } catch {
        if (!isMounted) {
          return;
        }

        setIsStarting(false);
        setError(
          "Camera scanner could not start. Allow camera permission and use HTTPS, or paste the QR data manually."
        );
      }
    }

    void startScanner();

    return () => {
      isMounted = false;
      stopScanner();
    };
  }, [handleScanValue, isOpen, stopScanner]);

  function handleManualScan() {
    const value = window.prompt("Scan or paste the product QR data");

    if (value?.trim()) {
      handleScanValue(value);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          scannedRef.current = false;
          setIsStarting(true);
          setError(null);
          setIsOpen(true);
        }}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 sm:w-auto"
      >
        <ScanLine size={18} />
        Scan Product
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-3 backdrop-blur-sm sm:items-center sm:p-4">
          <div className="w-full max-w-md rounded-[28px] bg-white p-4 shadow-2xl sm:p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-zinc-500">
                  Product scanner
                </p>
              <h2 className="mt-1 text-xl font-semibold sm:text-2xl">
                Scan product QR
              </h2>
              </div>
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-300 hover:bg-zinc-50"
                onClick={closeScanner}
                aria-label="Close scanner"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 overflow-hidden rounded-[24px] bg-zinc-950">
              <video
                ref={videoRef}
                muted
                playsInline
                className="aspect-[4/5] w-full object-cover sm:aspect-square"
              />
            </div>

            <div className="mt-4 rounded-2xl bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
              {isStarting
                ? "Starting camera..."
                : error ?? "Point the camera at the product QR code."}
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                className="rounded-full border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
                onClick={handleManualScan}
              >
                Paste QR
              </button>
              <button
                type="button"
                className="rounded-full bg-zinc-950 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800"
                onClick={closeScanner}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
