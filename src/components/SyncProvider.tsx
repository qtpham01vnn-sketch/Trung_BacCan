"use client";

import { useEffect } from "react";
import { syncService } from "@/lib/syncService";

export default function SyncProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    syncService.initAutoSync();
  }, []);

  return <>{children}</>;
}
