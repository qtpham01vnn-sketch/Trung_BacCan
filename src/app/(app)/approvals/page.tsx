"use client";

import { createClient } from "@/utils/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

// Định dạng ngày giờ Việt Nam
const formatDateTime = (isoString: string) => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleString('vi-VN', { 
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

export default function ApprovalsPage() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Lấy dữ liệu chờ duyệt (status = 'synced')
  const { data: pendingForms = [], isLoading, error } = useQuery({
    queryKey: ['pending_approvals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_forms')
        .select(`
          id, type, title, form_data, created_at, project_id,
          projects(name)
        `)
        .eq('status', 'synced')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  // Mutation cập nhật trạng thái
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('field_forms')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_approvals'] });
    },
    onSettled: () => {
      setProcessingId(null);
    }
  });

  // Mutation duyệt tất cả
  const approveAllMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('field_forms')
        .update({ status: 'approved', updated_at: new Date().toISOString() })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_approvals'] });
    }
  });

  const handleUpdate = (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    updateStatusMutation.mutate({ id, status });
  };

  const handleApproveAll = () => {
    if (pendingForms.length === 0) return;
    if (window.confirm(`Bạn có chắc muốn phê duyệt toàn bộ ${pendingForms.length} báo cáo?`)) {
      approveAllMutation.mutate(pendingForms.map(f => f.id));
    }
  };

  // Helper render chi tiết form
  const renderDetails = (type: string, data: any) => {
    switch (type) {
      case "hours":
        return (
          <div className="mt-2 text-sm">
            <p><span className="text-on-surface-variant">Máy xúc:</span> <span className="font-bold">{data.machineId}</span></p>
            <p><span className="text-on-surface-variant">Giờ hoạt động:</span> <span className="font-bold text-secondary">{data.hours} giờ</span></p>
          </div>
        );
      case "attendance":
        return (
          <div className="mt-2 text-sm">
            <p><span className="text-on-surface-variant">Số công nhân:</span> <span className="font-bold text-secondary">{data.workerCount} người</span></p>
            {data.notes && <p><span className="text-on-surface-variant">Ghi chú:</span> {data.notes}</p>}
          </div>
        );
      case "transport":
        return (
          <div className="mt-2 text-sm">
            <p><span className="text-on-surface-variant">Xe:</span> <span className="font-bold">{data.vehicleId}</span></p>
            <p><span className="text-on-surface-variant">Loại VL:</span> {data.material}</p>
            <p><span className="text-on-surface-variant">Số chuyến:</span> <span className="font-bold text-secondary">{data.trips} chuyến</span></p>
            {data.notes && <p><span className="text-on-surface-variant">Ghi chú:</span> {data.notes}</p>}
          </div>
        );
      case "volume":
        return (
          <div className="mt-2 text-sm">
            <p><span className="text-on-surface-variant">Vị trí:</span> {data.location}</p>
            <p><span className="text-on-surface-variant">Khối lượng:</span> <span className="font-bold text-secondary">{data.quantity} {data.unit}</span></p>
          </div>
        );
      case "expense":
        return (
          <div className="mt-2 text-sm">
            <p><span className="text-on-surface-variant">Hạng mục:</span> {data.category}</p>
            <p><span className="text-on-surface-variant">Số tiền chi:</span> <span className="font-bold text-error">{Number(data.amount).toLocaleString('vi-VN')} VNĐ</span></p>
            <p><span className="text-on-surface-variant">Mô tả:</span> {data.description}</p>
          </div>
        );
      case "photo":
        return (
          <div className="mt-2 text-sm">
            <div className="w-full h-32 relative bg-surface-container-high rounded overflow-hidden mb-2">
              <img src={data.photoUrl} alt="Hiện trường" className="w-full h-full object-cover" />
            </div>
            {data.notes && <p><span className="text-on-surface-variant">Ghi chú ảnh:</span> {data.notes}</p>}
          </div>
        );
      default:
        return <p className="mt-2 text-sm text-on-surface-variant italic">Không có dữ liệu chi tiết</p>;
    }
  };

  const getIconForType = (type: string) => {
    switch (type) {
      case "hours": return "settings_slow_motion";
      case "attendance": return "groups";
      case "transport": return "local_shipping";
      case "volume": return "architecture";
      case "expense": return "payments";
      case "photo": return "photo_camera";
      default: return "draft";
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
      <header className="mb-stack-lg flex justify-between items-end">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">Phê Duyệt</h2>
          <p className="font-body-md text-on-surface-variant">
            Dữ liệu chờ xác nhận từ công trường.
          </p>
        </div>
        
        <button 
          onClick={handleApproveAll}
          disabled={pendingForms.length === 0 || approveAllMutation.isPending}
          className="bg-primary text-white px-4 py-2 font-bold font-label-md flex items-center gap-2 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined">done_all</span>
          DUYỆT TẤT CẢ ({pendingForms.length})
        </button>
      </header>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
        </div>
      ) : error ? (
        <div className="p-4 bg-error-container text-on-error-container font-label-md">
          Đã xảy ra lỗi khi tải dữ liệu! Vui lòng thử lại.
        </div>
      ) : pendingForms.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-on-surface-variant/50 bg-surface-container-low border-2 border-dashed border-on-surface/20">
          <span className="material-symbols-outlined text-6xl mb-4 opacity-50">task</span>
          <span className="font-headline-sm font-bold uppercase tracking-widest opacity-50 text-center px-4">
            TUYỆT VỜI! KHÔNG CÓ BÁO CÁO NÀO TỒN ĐỌNG.
          </span>
        </div>
      ) : (
        <div className="space-y-4">
          {pendingForms.map((form: any) => (
            <div key={form.id} className="bg-surface-container-lowest border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] p-4 relative overflow-hidden group">
              {/* Type Badge */}
              <div className="absolute top-0 right-0 bg-surface-container-high px-3 py-1 border-b-2 border-l-2 border-on-surface flex items-center gap-1">
                <span className="material-symbols-outlined text-sm">{getIconForType(form.type)}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{form.type}</span>
              </div>

              <div className="pr-20">
                <h3 className="font-headline-sm text-primary mb-1 uppercase line-clamp-1" title={form.title}>
                  {form.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-on-surface-variant mb-3">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {formatDateTime(form.created_at)}
                  <span className="mx-1">•</span>
                  <span className="material-symbols-outlined text-sm">construction</span>
                  <span className="truncate max-w-[120px]">{form.projects?.name || form.project_id}</span>
                </div>
              </div>

              {/* Form Details */}
              <div className="bg-surface-container p-3 border border-on-surface/10 rounded mb-4">
                {renderDetails(form.type, form.form_data)}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button 
                  onClick={() => handleUpdate(form.id, 'approved')}
                  disabled={processingId === form.id}
                  className="flex-1 h-12 bg-emerald-600 text-white font-bold font-label-md flex items-center justify-center gap-2 border-2 border-on-surface hover:bg-emerald-500 active:scale-95 transition-all disabled:opacity-50"
                >
                  {processingId === form.id ? (
                    <span className="material-symbols-outlined animate-spin">sync</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">check_circle</span>
                      PHÊ DUYỆT
                    </>
                  )}
                </button>
                <button 
                  onClick={() => {
                    if (window.confirm("Từ chối báo cáo này?")) {
                      handleUpdate(form.id, 'rejected');
                    }
                  }}
                  disabled={processingId === form.id}
                  className="w-14 h-12 bg-surface-container-high text-error font-bold flex items-center justify-center border-2 border-on-surface hover:bg-error hover:text-white active:scale-95 transition-all disabled:opacity-50"
                  title="Từ chối"
                >
                  <span className="material-symbols-outlined">cancel</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
