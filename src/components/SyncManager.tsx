"use client";

import { useEffect, useState } from "react";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/client";

export function SyncManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    // Check initial status
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    // If we just came online, or periodically, try to sync
    let interval: NodeJS.Timeout;

    const syncData = async () => {
      if (!isOnline || isSyncing) return;
      
      try {
        setIsSyncing(true);
        // Find all pending forms
        const pendingForms = await db.fieldForms
          .where("status")
          .equals("pending_sync")
          .toArray();

        if (pendingForms.length === 0) {
          setIsSyncing(false);
          return;
        }

        console.log(`Bắt đầu đồng bộ ${pendingForms.length} bản ghi...`);

        // Get current user for auth (if needed for Row Level Security)
        const { data: { user } } = await supabase.auth.getUser();

        for (const form of pendingForms) {
          // Push to Supabase
          const { data, error } = await supabase
            .from("field_forms")
            .insert({
              id: form.id, // keep the same UUID
              workspace_id: form.workspace_id,
              project_id: form.project_id,
              type: form.type,
              title: form.title,
              form_data: form.form_data,
              status: "synced", // Update status on server
              created_by: user?.id || null,
              created_at: form.created_at,
            })
            .select()
            .single();

          if (error) {
            console.error(`Lỗi đồng bộ form ${form.id}:`, error);
            // If it's a hard error (like table missing), we might want to just skip or notify
          } else {
            // Success, update local DB
            await db.fieldForms.update(form.id, {
              status: "synced",
              server_id: data.id,
              updated_at: new Date().toISOString()
            });
            console.log(`Đã đồng bộ xong form ${form.id}`);
          }
        }
      } catch (err) {
        console.error("Lỗi tiến trình đồng bộ:", err);
      } finally {
        setIsSyncing(false);
      }
    };

    if (isOnline) {
      syncData(); // Run immediately when online
      interval = setInterval(syncData, 15000); // And run every 15s
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOnline, isSyncing, supabase]);

  return null; // This is a logic-only component
}
