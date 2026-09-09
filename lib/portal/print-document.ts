"use client";

import { flushSync } from "react-dom";

export async function printDocument(openDocument?: () => void) {
  if (openDocument) flushSync(openDocument);
  await document.fonts.ready;
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
  const documentArea = document.getElementById("print-area");
  if (!documentArea?.textContent?.trim()) return;
  window.print();
}
