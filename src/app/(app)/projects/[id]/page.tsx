"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";

// Định dạng ngày giờ Việt Nam
const formatDateTime = (isoString: string) => {
  return new Date(isoString).toLocaleString("vi-VN", {
    hour: '2-digit', minute: '2-digit',
    day: '2-digit', month: '2-digit', year: 'numeric'
  });
};

const TYPE_LABELS: Record<string, { label: string; icon: string }> = {
  hours: { label: 'GIỜ MÁY', icon: 'schedule' },
  attendance: { label: 'ĐIỂM DANH', icon: 'groups' },
  transport: { label: 'CHUYẾN XE', icon: 'local_shipping' },
  volume: { label: 'SẢN LƯỢNG', icon: 'bar_chart' },
  expense: { label: 'CHI PHÍ', icon: 'payments' },
  photo: { label: 'ẢNH HIỆN TRƯỜNG', icon: 'photo_camera' },
};

const STATUS_BADGES: Record<string, { label: string; bg: string; icon: string }> = {
  synced: { label: 'CHỜ DUYỆT', bg: 'bg-[#f59e0b]', icon: 'pending_actions' }, // Màu vàng
  approved: { label: 'ĐÃ DUYỆT', bg: 'bg-[#10b981]', icon: 'check_circle' }, // Màu xanh lá
  rejected: { label: 'TỪ CHỐI', bg: 'bg-[#ef4444]', icon: 'cancel' }, // Màu đỏ
};

export default function ProjectDetailsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const supabase = createClient();
  const [selectedForm, setSelectedForm] = useState<any>(null);

  // Lấy thông tin dự án
  const { data: project } = useQuery({
    queryKey: ['project', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', projectId)
        .single();
      if (error) throw error;
      return data;
    }
  });

  // Lấy toàn bộ lịch sử báo cáo của dự án
  const { data: historyForms = [], isLoading } = useQuery({
    queryKey: ['project_history', projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_forms')
        .select(`
          id, type, title, form_data, created_at, status
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data;
    }
  });

  const renderCardContent = (type: string, data: any) => {
    switch (type) {
      case 'attendance':
        return (
          <div className="bg-surface-container-lowest p-3 border-2 border-on-surface/10 mb-3">
            <div className="font-body-md text-on-surface mb-2">Số công nhân: <span className="font-bold text-lg">{data.workerCount} người</span></div>
            {data.notes && <div className="font-body-sm text-on-surface-variant italic">Ghi chú: <br/>{data.notes}</div>}
          </div>
        );
      case 'photo':
        return (
          <div className="bg-surface-container-lowest p-3 border-2 border-on-surface/10 mb-3 relative h-32">
             <Image src={data.photoUrl} alt="Hiện trường" fill className="object-cover" unoptimized />
          </div>
        );
      case 'hours':
        return (
          <div className="bg-surface-container-lowest p-3 border-2 border-on-surface/10 mb-3">
            <div className="font-body-md text-on-surface">Máy: <span className="font-bold">{data.machineId}</span></div>
            <div className="font-body-md text-on-surface">Ca làm: <span className="font-bold">{data.shift}</span></div>
            <div className="font-body-md text-on-surface">Số giờ: <span className="font-bold">{data.hours}h</span></div>
          </div>
        );
      case 'transport':
        return (
          <div className="bg-surface-container-lowest p-3 border-2 border-on-surface/10 mb-3">
            <div className="font-body-md text-on-surface">Xe: <span className="font-bold">{data.vehicleId}</span></div>
            <div className="font-body-md text-on-surface">Loại vật liệu: <span className="font-bold">{data.materialType}</span></div>
            <div className="font-body-md text-on-surface text-primary">Số chuyến: <span className="font-bold text-xl">{data.tripCount}</span></div>
          </div>
        );
      default:
        return (
          <div className="bg-surface-container-lowest p-3 border-2 border-on-surface/10 mb-3">
            <div className="font-body-sm text-on-surface-variant overflow-hidden text-ellipsis line-clamp-3">
              {JSON.stringify(data)}
            </div>
          </div>
        );
    }
  };

  const renderModalContent = (type: string, data: any) => {
    switch (type) {
      case 'attendance':
        return (
          <div className="space-y-4">
            <div className="text-xl">Số công nhân: <strong>{data.workerCount} người</strong></div>
            {data.notes && (
              <div className="bg-surface-container p-4 border-l-4 border-primary italic">
                {data.notes}
              </div>
            )}
          </div>
        );
      case 'photo':
        return (
          <div className="relative w-full h-[60vh] bg-black">
             <Image src={data.photoUrl} alt="Hiện trường" fill className="object-contain" unoptimized />
          </div>
        );
      case 'hours':
        return (
          <div className="space-y-4 text-lg">
            <div>Loại máy: <strong>{data.machineId}</strong></div>
            <div>Ca làm việc: <strong>{data.shift}</strong></div>
            <div>Số giờ hoạt động: <strong>{data.hours} giờ</strong></div>
            {data.notes && <div className="italic text-on-surface-variant">Ghi chú: {data.notes}</div>}
          </div>
        );
      case 'transport':
        return (
          <div className="space-y-4 text-lg">
            <div>Biển số xe: <strong>{data.vehicleId}</strong></div>
            <div>Loại vật liệu: <strong>{data.materialType}</strong></div>
            <div className="text-primary text-2xl">Số chuyến: <strong>{data.tripCount} chuyến</strong></div>
            {data.notes && <div className="italic text-on-surface-variant">Ghi chú: {data.notes}</div>}
          </div>
        );
      default:
        return <pre className="whitespace-pre-wrap text-sm">{JSON.stringify(data, null, 2)}</pre>;
    }
  };

  return (
    <div className="pb-24">
      {/* Header */}
      <header className="mb-stack-lg flex items-center gap-4">
        <Link href="/projects" className="w-12 h-12 bg-surface-container-lowest border-2 border-on-surface flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">
            {project ? project.name : 'Chi tiết Dự án'}
          </h2>
          <p className="font-body-md text-on-surface-variant">
            Lịch sử toàn bộ báo cáo
          </p>
        </div>
      </header>

      {/* History List */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
        </div>
      ) : historyForms.length === 0 ? (
        <div className="bg-surface-container-lowest border-2 border-on-surface p-8 text-center text-on-surface-variant">
          Chưa có báo cáo nào cho dự án này.
        </div>
      ) : (
        <div className="space-y-6">
          {historyForms.map((form: any) => {
            const typeInfo = TYPE_LABELS[form.type] || { label: 'KHÁC', icon: 'feed' };
            const statusInfo = STATUS_BADGES[form.status || 'synced'];

            return (
              <div 
                key={form.id} 
                className="bg-surface border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] hover:border-primary transition-colors cursor-pointer"
                onClick={() => setSelectedForm(form)}
              >
                {/* Status bar */}
                <div className={`px-4 py-2 ${statusInfo.bg} text-white font-bold font-label-md flex items-center gap-2 border-b-2 border-on-surface`}>
                  <span className="material-symbols-outlined text-[18px]">{statusInfo.icon}</span>
                  {statusInfo.label}
                </div>

                <div className="p-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-headline-sm text-headline-sm text-on-surface uppercase mb-1">
                        {form.title || typeInfo.label}
                      </h3>
                      <div className="flex items-center text-on-surface-variant font-label-md">
                        <span className="material-symbols-outlined text-[16px] mr-1">schedule</span>
                        {formatDateTime(form.created_at)}
                      </div>
                    </div>
                    <div className="bg-surface-container px-3 py-1 border-2 border-on-surface font-label-md flex items-center gap-1">
                      <span className="material-symbols-outlined text-[18px]">{typeInfo.icon}</span>
                      {form.type.toUpperCase()}
                    </div>
                  </div>

                  {renderCardContent(form.type, form.form_data)}

                  <div className="font-label-md text-primary flex items-center gap-1 mt-2">
                    <span className="material-symbols-outlined text-[18px]">visibility</span>
                    Bấm để xem chi tiết
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal View Chi Tiết */}
      {selectedForm && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 animate-in fade-in"
          onClick={() => setSelectedForm(null)}
        >
          <div 
            className="bg-surface w-full max-w-2xl border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] animate-in zoom-in-95 max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()} // Chặn click xuyên qua nền
          >
            {/* Header Modal */}
            <div className="p-4 border-b-2 border-on-surface flex justify-between items-center bg-surface-container sticky top-0 z-10 shrink-0">
              <div>
                <h2 className="font-headline-md uppercase">{selectedForm.title || TYPE_LABELS[selectedForm.type]?.label}</h2>
                <div className="text-sm text-on-surface-variant mt-1">{formatDateTime(selectedForm.created_at)}</div>
              </div>
              <button 
                onClick={() => setSelectedForm(null)} 
                className="w-10 h-10 flex items-center justify-center bg-surface-container-highest hover:bg-error hover:text-white transition-colors border-2 border-on-surface shadow-[2px_2px_0px_0px_rgba(25,28,30,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Nội dung Modal */}
            <div className="p-6 overflow-y-auto grow">
              {renderModalContent(selectedForm.type, selectedForm.form_data)}
            </div>
            
            {/* Nếu đang Chờ duyệt thì có thể duyệt luôn từ đây */}
            {selectedForm.status === 'synced' && (
              <div className="p-4 border-t-2 border-on-surface bg-surface-container flex gap-4 shrink-0">
                <Link href="/approvals" className="flex-1 text-center py-3 font-bold uppercase tracking-wider text-white bg-primary border-2 border-on-surface shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] active:translate-y-1 active:translate-x-1 active:shadow-none transition-all">
                  ĐI ĐẾN TRANG PHÊ DUYỆT
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
