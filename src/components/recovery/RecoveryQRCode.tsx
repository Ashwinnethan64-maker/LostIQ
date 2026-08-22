"use client";

import { useEffect, useRef } from "react";
import QRCode from "qrcode";

interface RecoveryQRCodeProps {
  payload: string;
  size?: number;
}

export function RecoveryQRCode({ payload, size = 220 }: RecoveryQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (canvasRef.current && payload) {
      QRCode.toCanvas(
        canvasRef.current,
        payload,
        {
          width: size,
          margin: 2,
          color: {
            dark: "#000000",
            light: "#FFD93D", // Signature LostIQ Neo-Brutalist yellow background
          },
          errorCorrectionLevel: "H",
        },
        (error) => {
          if (error) console.error("QR rendering error", error);
        }
      );
    }
  }, [payload, size]);

  return (
    <div className="inline-block p-3 bg-[#FFD93D] border-4 border-black shadow-neo-sm">
      <canvas ref={canvasRef} className="block mx-auto max-w-full" />
    </div>
  );
}
