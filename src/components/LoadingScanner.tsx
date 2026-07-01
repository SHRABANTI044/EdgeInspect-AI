"use client";

import { useEffect, useState } from "react";
import { Cpu, ScanLine } from "lucide-react";

const STEPS = [
  "Decoding image buffer",
  "Converting to luminance channel",
  "Applying Gaussian noise suppression",
  "Computing Sobel gradient field",
  "Adaptive edge thresholding",
  "Connected-component labeling",
  "Feature extraction & classification",
  "Calibrating confidence scores",
];

export default function LoadingScanner({
  imageUrl,
}: {
  imageUrl?: string;
}) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setStep((s) => (s + 1) % STEPS.length);
    }, 520);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[#0e2540] bg-[#06101d]">
      <div className="relative aspect-[4/3] w-full overflow-hidden">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt="processing"
            className="h-full w-full object-cover opacity-40"
          />
        ) : (
          <div className="h-full w-full bg-[radial-gradient(circle_at_50%_40%,#0d2a44,#06101d)]" />
        )}

        {/* scanning sweep */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="scanline" />
        </div>
        <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,229,255,0.04)_50%)] bg-[length:100%_4px]" />

        {/* center HUD */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center">
            <div className="spin-slow absolute inset-0 rounded-full border-2 border-dashed border-[#00E5FF]/40" />
            <div className="absolute inset-2 rounded-full border border-[#00AEEF]/30" />
            <Cpu className="h-8 w-8 text-[#00E5FF]" />
          </div>
          <p className="mt-4 font-mono text-xs uppercase tracking-[0.3em] text-[#00E5FF] glow-text">
            AI Inference Running
          </p>
        </div>
      </div>

      <div className="space-y-2 p-4">
        {STEPS.map((s, i) => (
          <div
            key={s}
            className={`flex items-center gap-2 font-mono text-[11px] transition-all ${
              i === step ? "text-[#00E5FF]" : "text-[#4d6480]"
            }`}
          >
            <ScanLine
              className={`h-3 w-3 ${i === step ? "blink" : ""}`}
            />
            <span>{s}</span>
            {i < step && (
              <span className="ml-auto text-[#22E58A]">DONE</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
