"use client";

import { useState } from "react";
import { clsx } from "clsx";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

// Define the shape of field_forms from Supabase
type FieldForm = {
  id: string;
  workspace_id: string;
  project_id: string;
  type: string;
  title: string;
  form_data: any;
  status: string;
  approval_status: "pending" | "approved" | "rejected";
  created_at: string;
};

// Helper to format data for UI
function getSummary(form: FieldForm) {
  const data = form.form_data || {};
  switch (form.type) {
    case "attendance":
      return `Số công nhân: ${data.workerCount || data.workers?.length || 0} người${data.notes ? ` - Ghi chú: ${data.notes}` : ''}`;
    case "hours":
      return `Giờ chạy: ${data.hours || data.runningHours || 0} giờ (Máy: ${data.machineId || 'N/A'})${data.notes ? ` - Ghi chú: ${data.notes}` : ''}`;
    case "volume":
      return `KL: ${data.quantity || 0} ${data.unit || ""}${data.location ? ` - Vị trí: ${data.location}` : ''}${data.notes ? ` - Ghi chú: ${data.notes}` : ''}`;
    case "transport":
      return `${data.trips || 0} chuyến - Xe: ${data.vehicleId || 'N/A'} (Vật liệu: ${data.material || ''})`;
    case "expense":
      return `Chi: ${data.amount || 0}đ - ${data.category || ''}${data.description ? ` - Ghi chú: ${data.description}` : ''}`;
    case "photo":
      return `[Hình ảnh] - Ghi chú: ${data.notes || "Không có ghi chú"}`;
    default:
      return "Chi tiết báo cáo...";
  }
}

function getIcon(type: string) {
  switch (type) {
    case "attendance": return "group";
    case "hours": return "engineering";
    case "volume": return "local_shipping";
    default: return "feed";
  }
}

export default function ApprovalsPage() {
  const [activeTab, setActiveTab] = useState<"CHỜ DUYỆT" | "ĐÃ DUYỆT" | "BỊ TỪ CHỐI">("CHỜ DUYỆT");
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch pending reports
  const { data: forms = [], isLoading } = useQuery({
    queryKey: ['field_forms', activeTab],
    queryFn: async () => {
      // Map UI tabs to DB approval_status
      let mappedStatus = "pending";
      if (activeTab === "ĐÃ DUYỆT") mappedStatus = "approved";
      if (activeTab === "BỊ TỪ CHỐI") mappedStatus = "rejected";

      const { data, error } = await supabase
        .from('field_forms')
        .select('*')
        .eq('approval_status', mappedStatus)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as FieldForm[];
    }
  });

  // Mutation to update approval_status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, newStatus }: { id: string, newStatus: "approved" | "rejected" }) => {
      const { error } = await supabase
        .from('field_forms')
        .update({ approval_status: newStatus })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['field_forms'] });
      setToastMessage(variables.newStatus === "approved" ? "Đã phê duyệt thành công!" : "Đã từ chối báo cáo!");
      setTimeout(() => setToastMessage(null), 3000);
    }
  });

  const handleAction = (id: string, action: "approve" | "reject") => {
    updateStatusMutation.mutate({ 
      id, 
      newStatus: action === "approve" ? "approved" : "rejected" 
    });
  };

  return (
    <>
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 right-4 z-50 bg-inverse-surface text-inverse-on-surface px-6 py-3 rounded-lg shadow-elevation-3 animate-in fade-in slide-in-from-top-4">
          <p className="font-label-lg">{toastMessage}</p>
        </div>
      )}

      {/* Screen Title & Filters */}
      <div className="mb-6 space-y-4">
        <h2 className="font-headline-lg text-headline-lg">Trung tâm phê duyệt</h2>
        
        {/* Search / Filter Bar */}
        <div className="relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
          <input 
            type="text" 
            placeholder="Tìm kiếm: ngày, giờ, biển số xe, loại máy, ghi chú..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest border-2 border-on-surface font-body-lg text-body-lg focus:outline-none focus:border-primary transition-all shadow-[4px_4px_0px_0px_rgba(25,28,30,1)]"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-error"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Tabs */}
      <div className="flex border-b-2 border-surface-container-highest mb-6 overflow-x-auto hide-scrollbar">
        {(["CHỜ DUYỆT", "ĐÃ DUYỆT", "BỊ TỪ CHỐI"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={clsx(
              "whitespace-nowrap px-6 py-4 font-label-lg text-label-lg uppercase tracking-wider transition-colors",
              activeTab === tab
                ? "border-b-4 border-primary text-primary"
                : "text-on-surface-variant hover:bg-surface-container-low"
            )}
            style={
              activeTab === tab
                ? { borderBottom: "4px solid var(--color-primary)" }
                : {}
            }
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Approval List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex justify-center p-12">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
          </div>
        ) : forms.length > 0 ? (
          (() => {
            // Apply search filter
            const filteredForms = forms.filter(item => {
              if (!searchQuery) return true;
              const query = searchQuery.toLowerCase();
              const summaryStr = getSummary(item).toLowerCase();
              const titleStr = item.title.toLowerCase();
              const dateStr = new Date(item.created_at).toLocaleString('vi-VN').toLowerCase();
              return summaryStr.includes(query) || titleStr.includes(query) || dateStr.includes(query);
            });

            if (filteredForms.length === 0) {
              return (
                <div className="p-8 text-center bg-surface-container-lowest border-2 border-dashed border-on-surface/20">
                  <p className="font-body-lg text-on-surface-variant">Không tìm thấy báo cáo nào khớp với từ khóa "{searchQuery}"</p>
                </div>
              );
            }

            return filteredForms.map((item) => (
              <div
                key={item.id}
                className="bg-surface-container-lowest border-2 border-on-surface p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in slide-in-from-bottom-2"
              >
              <div className="flex gap-4">
                <div className="h-12 w-12 bg-secondary-container flex items-center justify-center border-2 border-on-surface flex-shrink-0">
                  <span className="material-symbols-outlined text-on-secondary-container">
                    {getIcon(item.type)}
                  </span>
                </div>
                <div>
                  <p className="font-label-lg text-label-lg text-primary">ID: {item.id.slice(0,8).toUpperCase()}</p>
                  <h3 className="font-headline-sm text-headline-sm leading-tight">
                    {item.title}
                  </h3>
                  <p className="font-label-md text-label-md text-on-surface-variant">
                    {new Date(item.created_at).toLocaleString('vi-VN')}
                  </p>
                </div>
              </div>
              
              <div className="bg-surface-container-low p-2 border-l-4 border-primary min-w-[200px] flex flex-col md:flex-row gap-4 items-start md:items-center">
                <div className="flex-1">
                  <p className="font-label-md text-label-md uppercase text-on-surface-variant">
                    TỔNG QUAN
                  </p>
                  <p className="font-body-md text-body-md font-bold">{getSummary(item)}</p>
                </div>
                {item.type === "photo" && item.form_data?.photoUrl && (
                  <div className="w-24 h-24 border-2 border-on-surface bg-surface-container-lowest overflow-hidden flex-shrink-0 relative group">
                    <img src={item.form_data.photoUrl} alt="Field Photo" className="w-full h-full object-cover" />
                    <button 
                      onClick={() => setZoomedImage(item.form_data.photoUrl)}
                      title="Xem ảnh lớn" 
                      className="absolute inset-0 w-full h-full bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-zoom-in"
                    >
                      <span className="material-symbols-outlined text-white">zoom_in</span>
                    </button>
                  </div>
                )}
              </div>

              {activeTab === "CHỜ DUYỆT" && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAction(item.id, "approve")}
                    disabled={updateStatusMutation.isPending}
                    className="h-tap-target-min flex-1 md:flex-none px-4 bg-[#10b981] text-white border-2 border-on-surface flex items-center justify-center gap-2 font-label-lg active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">check_circle</span>
                    Duyệt
                  </button>
                  <button
                    onClick={() => handleAction(item.id, "reject")}
                    disabled={updateStatusMutation.isPending}
                    className="h-tap-target-min flex-1 md:flex-none px-4 bg-[#f43f5e] text-white border-2 border-on-surface flex items-center justify-center gap-2 font-label-lg active:scale-95 transition-transform disabled:opacity-50"
                  >
                    <span className="material-symbols-outlined">cancel</span>
                    Từ chối
                  </button>
                </div>
              )}
            </div>
            ));
          })()
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95">
            <span className="material-symbols-outlined text-surface-container-highest text-8xl mb-4">
              task_alt
            </span>
            <p className="font-headline-sm text-headline-sm text-on-surface-variant">
              Không có dữ liệu!
            </p>
            <p className="font-body-md text-body-md text-outline">
              Hiện không có báo cáo nào ở trạng thái {activeTab.toLowerCase()}.
            </p>
          </div>
        )}
      </div>

      {/* Fullscreen Image Modal (Lightbox) */}
      {zoomedImage && (
        <div className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 animate-in fade-in" onClick={() => setZoomedImage(null)}>
          <button 
            className="absolute top-6 right-6 w-12 h-12 bg-white/10 hover:bg-white/20 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
            onClick={() => setZoomedImage(null)}
          >
            <span className="material-symbols-outlined text-3xl">close</span>
          </button>
          <img 
            src={zoomedImage} 
            alt="Zoomed Field Photo" 
            className="max-w-full max-h-full object-contain animate-in zoom-in-95 border-4 border-white/10" 
            onClick={(e) => e.stopPropagation()} // Prevent click from closing when clicking the image itself
          />
        </div>
      )}
    </>
  );
}
