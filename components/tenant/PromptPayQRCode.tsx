"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Maximize2, QrCode as QrIcon, X } from "lucide-react";
import { formatPromptPayDisplay, generatePromptPayPayload } from "@/lib/constants/promptpay";

interface PromptPayQRCodeProps {
  promptpayId: string;
  amount?: number | null;
  accountName?: string;
  size?: number;
}

export function PromptPayQRCode({
  promptpayId,
  amount,
  accountName,
  size = 140,
}: PromptPayQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dataUrl, setDataUrl] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    let active = true;

    async function renderQR() {
      try {
        const payload = generatePromptPayPayload(promptpayId, amount);

        // 1. Generate inner QR code matrix
        const qrSize = 540;
        const innerQrCanvas = document.createElement("canvas");
        await QRCode.toCanvas(innerQrCanvas, payload, {
          width: qrSize,
          margin: 1,
          color: {
            dark: "#013d69", // PromptPay signature navy blue
            light: "#ffffff",
          },
          errorCorrectionLevel: "M",
        });

        // 2. Create the full PromptPay QR card canvas
        const cardWidth = 600;
        const cardHeight = 710;
        const cardCanvas = document.createElement("canvas");
        cardCanvas.width = cardWidth;
        cardCanvas.height = cardHeight;
        const ctx = cardCanvas.getContext("2d");

        if (ctx) {
          // Fill background white
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, cardWidth, cardHeight);

          // Top Header: Draw PromptPay Banner (cropped from public/images/bank/พร้อมเพย์.png)
          const logo = new Image();
          logo.crossOrigin = "anonymous";
          logo.src = "/images/bank/พร้อมเพย์.png";
          await new Promise<void>((resolve) => {
            logo.onload = () => resolve();
            logo.onerror = () => resolve();
          });

          if (logo.complete && logo.naturalWidth > 0) {
            // Source bounding box: x: 27, y: 171, w: 447, h: 151 (aspect ratio ~2.96:1)
            const bannerWidth = 310;
            const bannerHeight = (151 / 447) * bannerWidth; // ~104.7px
            const bannerX = (cardWidth - bannerWidth) / 2;
            const bannerY = 16;

            ctx.drawImage(
              logo,
              27,
              171,
              447,
              151,
              bannerX,
              bannerY,
              bannerWidth,
              bannerHeight
            );
          }

          // Draw QR code matrix below banner
          const qrX = (cardWidth - qrSize) / 2;
          const qrY = 135;
          ctx.drawImage(innerQrCanvas, qrX, qrY, qrSize, qrSize);
        }

        if (!active) return;

        const url = cardCanvas.toDataURL("image/png");
        setDataUrl(url);

        // Draw onto the visible canvas
        if (canvasRef.current) {
          const destCtx = canvasRef.current.getContext("2d");
          if (destCtx) {
            const destWidth = size;
            const destHeight = Math.round(size * (cardHeight / cardWidth));
            canvasRef.current.width = destWidth;
            canvasRef.current.height = destHeight;
            destCtx.drawImage(cardCanvas, 0, 0, destWidth, destHeight);
          }
        }
      } catch (err) {
        console.error("Failed to generate PromptPay QR", err);
      }
    }

    renderQR();

    return () => {
      active = false;
    };
  }, [promptpayId, amount, size]);

  // Modal keydown listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setModalOpen(false);
    };
    if (modalOpen) {
      window.addEventListener("keydown", handleKeyDown);
      return () => window.removeEventListener("keydown", handleKeyDown);
    }
  }, [modalOpen]);

  function handleDownload() {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `PromptPay-QR-${promptpayId}${amount ? `-${amount}` : ""}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  return (
    <div className="flex flex-col items-center">
      <div
        onClick={() => setModalOpen(true)}
        className="group relative cursor-pointer overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-2 shadow-xs transition hover:border-blue-400 hover:shadow-md"
        title="คลิกเพื่อดูภาพ QR Code ขนาดใหญ่"
      >
        <canvas ref={canvasRef} className="block rounded-xl" />
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30 opacity-0 transition-opacity group-hover:opacity-100 rounded-2xl backdrop-blur-2xs">
          <span className="flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] font-semibold text-white shadow-xs">
            <Maximize2 size={11} />
            <span>แตะเพื่อขยาย</span>
          </span>
        </div>
      </div>

      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
        <QrIcon size={12} className="text-blue-600" />
        <span>สแกนจ่ายด้วยแอปธนาคาร</span>
      </div>

      {/* Modal View */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs"
          onClick={() => setModalOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative flex w-full max-w-sm flex-col items-center overflow-hidden rounded-3xl bg-white p-6 shadow-2xl text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="absolute right-4 top-4 rounded-full bg-slate-100 p-1.5 text-slate-500 transition hover:bg-slate-200 hover:text-slate-800 cursor-pointer"
              title="ปิด"
            >
              <X size={18} />
            </button>

            {/* Modal Header */}
            <div className="flex flex-col items-center gap-1 mb-3 pt-1">
              <strong className="text-sm font-bold text-slate-800">
                สแกนคิวอาร์โค้ดเพื่อชำระเงิน
              </strong>
              {accountName && (
                <p className="text-xs text-slate-600">
                  ชื่อบัญชี: <span className="font-bold text-slate-900">{accountName}</span>
                </p>
              )}
              {amount && amount > 0 ? (
                <p className="mt-0.5 text-lg font-black text-blue-700">
                  ฿{amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </p>
              ) : null}
            </div>

            {/* PromptPay QR Card Display */}
            {dataUrl ? (
              <div className="rounded-2xl border border-slate-200/90 p-2.5 bg-white shadow-sm">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={dataUrl}
                  alt="PromptPay QR Code"
                  className="w-64 max-w-full object-contain rounded-xl"
                />
              </div>
            ) : (
              <div className="h-72 w-64 animate-pulse rounded-2xl bg-slate-100" />
            )}

            <p className="mt-2 text-xs font-mono font-bold text-slate-700">
              {formatPromptPayDisplay(promptpayId)}
            </p>

            <div className="mt-4 flex w-full gap-2">
              <button
                type="button"
                onClick={handleDownload}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 py-2.5 text-xs font-bold text-white transition hover:bg-blue-700 shadow-xs cursor-pointer"
              >
                <Download size={14} />
                <span>บันทึกภาพ QR</span>
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 cursor-pointer"
              >
                ปิด
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
