"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

type AppNavLinkProps = Omit<ComponentProps<typeof Link>, "aria-current" | "aria-disabled" | "onNavigate"> & {
  active: boolean;
};

export function AppNavLink({ active, ...props }: AppNavLinkProps) {
  return <Link
    {...props}
    aria-current={active ? "page" : undefined}
    aria-disabled={active || undefined}
    onNavigate={(event) => {
      if (active) event.preventDefault();
    }}
  />;
}
