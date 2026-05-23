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
  const [selectedForm, setSelectedForm] = useState<any>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  // Filter states
  const [filterProject, setFilterProject] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');

  // Lấy danh sách dự án cho bộ lọc
  const { data: projects = [] } = useQuery({
    queryKey: ['projects_list_filter'],
    queryFn: async () => {
      const { data } = await supabase.from('projects').select('id, name');
      return data || [];
    }
  });

  // Lấy dữ liệu chờ duyệt (status = 'synced')
  const { data: pendingForms = [], isLoading, error } = useQuery({
    queryKey: ['pending_approvals', filterProject, filterType],
    queryFn: async () => {
      let query = supabase
        .from('field_forms')
        .select(`
          id, type, title, form_data, created_at, project_id
        `)
        .eq('status', 'synced')
        .order('created_at', { ascending: false });
        
      if (filterProject !== 'all') {
        query = query.eq('project_id', filterProject);
      }
      if (filterType !== 'all') {
        query = query.eq('type', filterType);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Mutation cập nhật trạng thái
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: 'approved' | 'rejected' }) => {
      const { error } = await supabase
        .from('field_forms')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pending_approvals'] });
    },
    onSettled: () => {
      setProcessingId(null);
      setSelectedForm(null); // Close modal on success
    }
  });

  // Mutation duyệt tất cả
  const approveAllMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from('field_forms')
        .update({ status: 'approved' })
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
  const renderDetails = (type: string, data: any, isModal: boolean = false) => {
    switch (type) {
      case "hours":
        return (
          <div className="mt-2 text-sm space-y-1">
            <p><span className="text-on-surface-variant">Máy xúc:</span> <span className="font-bold text-base">{data.machineId}</span></p>
            <p><span className="text-on-surface-variant">Giờ hoạt động:</span> <span className="font-bold text-secondary text-lg">{data.hours} giờ</span></p>
          </div>
        );
      case "attendance":
        return (
          <div className="mt-2 text-sm space-y-1">
            <p><span className="text-on-surface-variant">Số công nhân:</span> <span className="font-bold text-secondary text-lg">{data.workerCount} người</span></p>
            {data.notes && <p><span className="text-on-surface-variant block">Ghi chú:</span> <span className="italic">{data.notes}</span></p>}
          </div>
        );
      case "transport":
        return (
          <div className="mt-2 text-sm space-y-1">
            <p><span className="text-on-surface-variant">Xe:</span> <span className="font-bold text-base">{data.vehicleId}</span></p>
            <p><span className="text-on-surface-variant">Loại VL:</span> {data.material}</p>
            <p><span className="text-on-surface-variant">Số chuyến:</span> <span className="font-bold text-secondary text-lg">{data.trips} chuyến</span></p>
            {data.notes && <p><span className="text-on-surface-variant block">Ghi chú:</span> <span className="italic">{data.notes}</span></p>}
          </div>
        );
      case "volume":
        return (
          <div className="mt-2 text-sm space-y-1">
            <p><span className="text-on-surface-variant">Vị trí:</span> {data.location}</p>
            <p><span className="text-on-surface-variant">Khối lượng:</span> <span className="font-bold text-secondary text-lg">{data.quantity} {data.unit}</span></p>
            {data.notes && <p><span className="text-on-surface-variant block">Ghi chú:</span> <span className="italic">{data.notes}</span></p>}
          </div>
        );
      case "expense":
        return (
          <div className="mt-2 text-sm space-y-1">
            <p><span className="text-on-surface-variant">Hạng mục:</span> {data.category}</p>
            <p><span className="text-on-surface-variant">Số tiền chi:</span> <span className="font-bold text-error text-xl">{Number(data.amount).toLocaleString('vi-VN')} VNĐ</span></p>
            <p><span className="text-on-surface-variant block">Mô tả:</span> {data.description}</p>
          </div>
        );
      case "photo":
        return (
          <div className="mt-2 text-sm">
            <div className={`w-full ${isModal ? 'h-[50vh] md:h-[60vh]' : 'h-32'} relative bg-surface-container-highest rounded overflow-hidden mb-3 border-2 border-on-surface/20`}>
              <img src={data.photoUrl} alt="Hiện trường" className={`w-full h-full ${isModal ? 'object-contain' : 'object-cover'}`} />
            </div>
            {data.notes && <p><span className="text-on-surface-variant block font-bold mb-1">Ghi chú ảnh:</span> <span className="text-base">{data.notes}</span></p>}
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

      {/* Bộ Lọc */}
      <div className="flex gap-3 mb-6">
        <select
          value={filterProject}
          onChange={(e) => setFilterProject(e.target.value)}
          className="flex-1 h-12 px-3 bg-surface-container-lowest border-2 border-on-surface font-body-md text-body-md focus:outline-none focus:border-primary shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] appearance-none rounded-none"
        >
          <option value="all">-- Tất cả Dự án --</option>
          <option value="default-project">Dự án mặc định</option>
          {projects.map((p: any) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="flex-1 h-12 px-3 bg-surface-container-lowest border-2 border-on-surface font-body-md text-body-md focus:outline-none focus:border-primary shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] appearance-none rounded-none"
        >
          <option value="all">-- Tất cả Loại báo cáo --</option>
          <option value="hours">Giờ máy</option>
          <option value="attendance">Điểm danh</option>
          <option value="transport">Chuyến xe</option>
          <option value="volume">Sản lượng</option>
          <option value="expense">Chi phí</option>
          <option value="photo">Hình ảnh</option>
        </select>
      </div>

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
        <div className="space-y-4 pb-20">
          {pendingForms.map((form: any) => (
            <div key={form.id} className="bg-surface-container-lowest border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] p-0 relative overflow-hidden group">
              {/* Type Badge */}
              <div className="absolute top-0 right-0 bg-surface-container-high px-3 py-1 border-b-2 border-l-2 border-on-surface flex items-center gap-1 z-10">
                <span className="material-symbols-outlined text-sm">{getIconForType(form.type)}</span>
                <span className="text-xs font-bold uppercase tracking-wider">{form.type}</span>
              </div>

              {/* Clickable Area for Details */}
              <div 
                className="p-4 cursor-pointer hover:bg-surface-container-low transition-colors"
                onClick={() => setSelectedForm(form)}
              >
                <div className="pr-24">
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

                {/* Form Details Preview */}
                <div className="bg-surface-container p-3 border border-on-surface/10 rounded">
                  {renderDetails(form.type, form.form_data, false)}
                </div>
                
                <div className="mt-2 text-primary font-bold text-sm flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <span className="material-symbols-outlined text-sm">visibility</span> Bấm để xem chi tiết
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-0 border-t-2 border-on-surface">
                <button 
                  onClick={(e) => { e.stopPropagation(); handleUpdate(form.id, 'approved'); }}
                  disabled={processingId === form.id}
                  className="flex-1 h-14 bg-emerald-600 text-white font-bold font-label-lg flex items-center justify-center gap-2 hover:bg-emerald-500 transition-all disabled:opacity-50"
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
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm("Từ chối báo cáo này?")) {
                      handleUpdate(form.id, 'rejected');
                    }
                  }}
                  disabled={processingId === form.id}
                  className="w-16 h-14 bg-error text-white font-bold flex items-center justify-center border-l-2 border-on-surface hover:bg-red-700 transition-all disabled:opacity-50"
                  title="Từ chối"
                >
                  <span className="material-symbols-outlined">cancel</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Chi Tiết */}
      {selectedForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-surface-container-lowest w-full max-w-2xl max-h-[90vh] flex flex-col border-4 border-on-surface shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] overflow-hidden animate-in zoom-in-95 duration-200">
            
            <header className="p-4 border-b-2 border-on-surface bg-surface-container-high flex justify-between items-start">
              <div className="pr-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="material-symbols-outlined text-primary">{getIconForType(selectedForm.type)}</span>
                  <span className="font-bold uppercase tracking-wider text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    {selectedForm.type}
                  </span>
                </div>
                <h2 className="font-headline-sm text-on-surface uppercase leading-tight">{selectedForm.title}</h2>
                <div className="flex items-center gap-2 text-sm text-on-surface-variant mt-2">
                  <span className="material-symbols-outlined text-sm">schedule</span>
                  {formatDateTime(selectedForm.created_at)}
                  <span className="mx-1">•</span>
                  <span className="material-symbols-outlined text-sm">construction</span>
                  <span>{selectedForm.projects?.name || selectedForm.project_id}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedForm(null)}
                className="w-10 h-10 bg-surface-container-highest border-2 border-on-surface flex items-center justify-center hover:bg-error hover:text-white transition-colors active:scale-95 flex-shrink-0"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </header>

            <div className="p-6 overflow-y-auto flex-1 bg-surface-container-lowest">
              <h4 className="font-label-lg font-bold uppercase tracking-widest text-on-surface-variant mb-4 border-b-2 border-on-surface/10 pb-2">NỘI DUNG BÁO CÁO</h4>
              {renderDetails(selectedForm.type, selectedForm.form_data, true)}
            </div>

            <footer className="p-4 border-t-2 border-on-surface bg-surface-container flex gap-3">
              <button 
                onClick={() => handleUpdate(selectedForm.id, 'approved')}
                disabled={processingId === selectedForm.id}
                className="flex-1 h-14 bg-emerald-600 text-white font-bold font-label-lg flex items-center justify-center gap-2 border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:bg-emerald-500 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50"
              >
                {processingId === selectedForm.id ? (
                  <span className="material-symbols-outlined animate-spin">sync</span>
                ) : (
                  <>
                    <span className="material-symbols-outlined">check_circle</span>
                    PHÊ DUYỆT BÁO CÁO NÀY
                  </>
                )}
              </button>
              <button 
                onClick={() => {
                  if (window.confirm("Từ chối báo cáo này?")) {
                    handleUpdate(selectedForm.id, 'rejected');
                  }
                }}
                disabled={processingId === selectedForm.id}
                className="w-16 h-14 bg-error text-white font-bold flex items-center justify-center border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:bg-red-700 active:translate-y-1 active:translate-x-1 active:shadow-none transition-all disabled:opacity-50"
                title="Từ chối"
              >
                <span className="material-symbols-outlined">cancel</span>
              </button>
            </footer>
          </div>
        </div>
      )}
    </div>
  );
}
