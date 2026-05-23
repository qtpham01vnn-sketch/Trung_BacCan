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
          let finalFormData = { ...form.form_data };
          
          // BƯỚC XỬ LÝ ẢNH BASE64
          if (form.type === "photo" && finalFormData.photoUrl && finalFormData.photoUrl.startsWith("data:image")) {
            try {
              // 1. Chuyển đổi Base64 thành Blob
              const res = await fetch(finalFormData.photoUrl);
              const blob = await res.blob();
              const ext = blob.type.split('/')[1] || 'jpg';
              
              // 2. Upload lên Storage Bucket
              const fileName = `${user?.id || 'guest'}/${Date.now()}-${form.id}.${ext}`;
              const { data: uploadData, error: uploadError } = await supabase
                .storage
                .from('field-photos')
                .upload(fileName, blob, {
                  cacheControl: '3600',
                  upsert: false
                });

              if (uploadError) {
                console.error(`Lỗi upload ảnh lên Storage (${form.id}):`, uploadError);
                continue; // Lỗi upload ảnh thì bỏ qua form này để lần sau sync lại
              }
              
              // 3. Lấy Public URL
              const { data: publicUrlData } = supabase
                .storage
                .from('field-photos')
                .getPublicUrl(fileName);
                
              // 4. Ghi đè Base64 khổng lồ bằng đường dẫn URL ngắn
              finalFormData.photoUrl = publicUrlData.publicUrl;
            } catch (err) {
              console.error(`Lỗi biến đổi dữ liệu ảnh (${form.id}):`, err);
              continue; // Lỗi thì bỏ qua
            }
          }

          // Push to Supabase Database
          const { data, error } = await supabase
            .from("field_forms")
            .insert({
              id: form.id, // keep the same UUID
              workspace_id: form.workspace_id,
              project_id: form.project_id,
              type: form.type,
              title: form.title,
              form_data: finalFormData, // Sử dụng finalFormData đã tối ưu
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
              form_data: finalFormData, // Lưu đè lại data local bằng URL ngắn gọn để giải phóng bộ nhớ
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
