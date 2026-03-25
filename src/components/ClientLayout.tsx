"use client";

import { type ReactNode } from "react";
import ErrorBoundary from "./ErrorBoundary";

export default function ClientLayout({ children }: { children: ReactNode }) {
  return <ErrorBoundary>{children}</ErrorBoundary>;
}
