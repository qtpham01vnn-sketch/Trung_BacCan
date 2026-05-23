"use client";

import { useEffect, useState, useRef } from "react";
import { db } from "@/lib/db";
import { createClient } from "@/utils/supabase/client";
import { clsx } from "clsx";

export function SyncManager() {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "syncing" | "success" | "error">("idle");
  const [pendingCount, setPendingCount] = useState(0);
  const supabase = createClient();
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => {
      setIsOnline(true);
      retryCountRef.current = 0; // Reset retry on reconnect
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  useEffect(() => {
    // Check pending count regularly
    const checkPending = async () => {
      try {
        const count = await db.fieldForms.where("status").equals("pending_sync").count();
        setPendingCount(count);
      } catch (e) {
        // ignore
      }
    };
    checkPending();
    const countInterval = setInterval(checkPending, 5000);
    return () => clearInterval(countInterval);
  }, []);

  useEffect(() => {
    // Pull master data and projects for offline use
    const pullMasterData = async () => {
      if (!isOnline) return;
      try {
        const { data: projectsData } = await supabase.from('projects').select('id, name');
        if (projectsData) {
          await db.projects.bulkPut(projectsData);
        }

        const { data: masterData } = await supabase.from('master_data').select('*');
        if (masterData) {
          await db.masterData.bulkPut(masterData);
        }
      } catch (e) {
        console.error("Failed to pull master data:", e);
      }
    };

    pullMasterData();
    // Refresh master data every hour
    const interval = setInterval(pullMasterData, 3600000);
    return () => clearInterval(interval);
  }, [isOnline, supabase]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    const syncData = async () => {
      if (!isOnline || isSyncing) return;
      
      try {
        const pendingForms = await db.fieldForms.where("status").equals("pending_sync").toArray();

        if (pendingForms.length === 0) {
          if (syncStatus === "syncing") {
            setSyncStatus("success");
            setTimeout(() => setSyncStatus("idle"), 3000);
          }
          return;
        }

        setIsSyncing(true);
        setSyncStatus("syncing");
        const { data: { user } } = await supabase.auth.getUser();

        let hasError = false;

        for (const form of pendingForms) {
          let finalFormData = { ...form.form_data };
          
          if (form.type === "photo" && finalFormData.photoUrl && finalFormData.photoUrl.startsWith("data:image")) {
            try {
              const res = await fetch(finalFormData.photoUrl);
              const blob = await res.blob();
              const ext = blob.type.split('/')[1] || 'jpg';
              
              const fileName = `${user?.id || 'guest'}/${Date.now()}-${form.id}.${ext}`;
              const { error: uploadError } = await supabase.storage.from('field-photos').upload(fileName, blob, {
                cacheControl: '3600',
                upsert: false
              });

              if (uploadError) throw uploadError;
              
              const { data: publicUrlData } = supabase.storage.from('field-photos').getPublicUrl(fileName);
              finalFormData.photoUrl = publicUrlData.publicUrl;
            } catch (err) {
              console.error(`Upload error (${form.id}):`, err);
              hasError = true;
              continue; // Skip and retry later
            }
          }

          const { data, error } = await supabase.from("field_forms").insert({
            id: form.id,
            workspace_id: form.workspace_id,
            project_id: form.project_id,
            type: form.type,
            title: form.title,
            form_data: finalFormData,
            status: "synced",
            created_by: user?.id || null,
            created_at: form.created_at,
          }).select().single();

          if (error) {
            console.error(`DB Sync error ${form.id}:`, error);
            hasError = true;
          } else {
            await db.fieldForms.update(form.id, {
              status: "synced",
              server_id: data.id,
              form_data: finalFormData,
              updated_at: new Date().toISOString()
            });
            setPendingCount(prev => Math.max(0, prev - 1));
          }
        }

        if (hasError) {
          throw new Error("Some forms failed to sync");
        }

        // Success
        retryCountRef.current = 0;
        setSyncStatus("success");
        setTimeout(() => setSyncStatus("idle"), 3000);

      } catch (err) {
        console.error("Sync process error:", err);
        setSyncStatus("error");
        
        // Exponential backoff retry
        const backoffTime = Math.min(1000 * Math.pow(2, retryCountRef.current), 60000); // Max 1 minute
        retryCountRef.current += 1;
        
        if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = setTimeout(() => {
          setSyncStatus("idle"); // reset to allow next interval to pick it up
        }, backoffTime);

      } finally {
        setIsSyncing(false);
      }
    };

    if (isOnline) {
      if (pendingCount > 0 && syncStatus === "idle") {
        syncData();
      }
      interval = setInterval(() => {
        if (syncStatus === "idle" && pendingCount > 0) syncData();
      }, 10000); // Check every 10s if we need to sync
    }

    return () => {
      if (interval) clearInterval(interval);
      if (retryTimeoutRef.current) clearTimeout(retryTimeoutRef.current);
    };
  }, [isOnline, isSyncing, pendingCount, syncStatus, supabase]);

  // Determine what to render based on status
  let showToast = false;
  let toastColor = "bg-surface";
  let toastIcon = "";
  let toastText = "";
  let textColor = "text-on-surface";

  if (!isOnline) {
    showToast = true;
    toastColor = "bg-surface-container-highest";
    toastIcon = "cloud_off";
    toastText = "Ngoại tuyến - Dữ liệu lưu nội bộ";
    textColor = "text-error";
  } else if (syncStatus === "syncing") {
    showToast = true;
    toastColor = "bg-primary-container";
    toastIcon = "sync";
    toastText = `Đang đồng bộ (${pendingCount}) báo cáo...`;
    textColor = "text-on-primary-container";
  } else if (syncStatus === "success" && pendingCount === 0) {
    showToast = true;
    toastColor = "bg-emerald-100";
    toastIcon = "check_circle";
    toastText = "Đồng bộ hoàn tất!";
    textColor = "text-emerald-800";
  } else if (syncStatus === "error") {
    showToast = true;
    toastColor = "bg-error-container";
    toastIcon = "warning";
    toastText = "Đồng bộ lỗi, đang thử lại...";
    textColor = "text-on-error-container";
  }

  if (!showToast) return null;

  return (
    <div className="fixed top-20 right-4 z-[9999] pointer-events-none animate-in slide-in-from-top-5 fade-in duration-300">
      <div className={clsx(
        "flex items-center gap-2 px-4 py-3 border-4 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]",
        toastColor
      )}>
        <span className={clsx("material-symbols-outlined", textColor, syncStatus === "syncing" && "animate-spin")}>
          {toastIcon}
        </span>
        <span className={clsx("font-label-md font-bold uppercase tracking-tight", textColor)}>
          {toastText}
        </span>
      </div>
    </div>
  );
}
