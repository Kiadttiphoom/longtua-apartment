"use client";

import { useState } from "react";

const publicAssetsBaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_BASE_URL?.replace(/\/$/, "");

export function BrandLogo({ className = "" }: { className?: string }) {
  const [hasError, setHasError] = useState(false);
  const logoUrl = publicAssetsBaseUrl ? `${publicAssetsBaseUrl}/brand/logo.png` : null;

  if (!logoUrl || hasError) {
    return (
      <span className={`brand-logo-fallback ${className}`.trim()}>
        <strong>LONGTUA</strong>
        <small>APARTMENT</small>
      </span>
    );
  }

  return (
    // The public R2 domain already serves and caches this optimized brand asset.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={`brand-logo-image ${className}`.trim()}
      src={logoUrl}
      alt="LONGTUA Apartment"
      onError={() => setHasError(true)}
    />
  );
}
