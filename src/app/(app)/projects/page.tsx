"use client";

import { useState } from "react";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

type Project = {
  id: string;
  name: string;
  status: "Đang chạy" | "Hoàn thành";
  progress: number;
  members: number;
};

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: projects = [], isLoading, error } = useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Project[];
    }
  });

  if (error) {
    console.error("Supabase Error:", error);
  }

  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      {/* Search and Filter Section */}
      <section className="mb-stack-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
            search
          </span>
          <input
            className="w-full h-14 pl-12 pr-4 bg-surface-container-lowest border-2 border-on-surface rounded-none focus:ring-0 focus:border-primary-container font-body-md transition-colors placeholder:text-on-surface-variant"
            placeholder="Tìm tên dự án..."
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </section>

      {/* Project List (Bento Grid Style) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-stack-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-150">
        
        {isLoading ? (
          <div className="col-span-full flex justify-center p-8">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">sync</span>
          </div>
        ) : error ? (
          <div className="col-span-full bg-error-container text-on-error-container border-2 border-error p-8 text-center font-bold">
            Lỗi khi tải dữ liệu: {error.message}
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="col-span-full bg-surface-container-lowest border-2 border-on-surface p-8 text-center text-on-surface-variant">
            Không có dự án nào
          </div>
        ) : (
          filteredProjects.map((project) => (
            <div
              key={project.id}
              className="bg-surface-container-lowest border-2 border-on-surface p-stack-md flex flex-col justify-between min-h-[180px] hover:border-primary-container transition-colors group"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-headline-sm text-headline-sm text-on-surface mb-1">
                    {project.name}
                  </h3>
                  <span
                    className={`inline-block px-3 py-1 font-label-lg rounded-none text-white ${
                      project.status === "Đang chạy"
                        ? "bg-[#10b981]"
                        : "bg-on-secondary-fixed-variant"
                    }`}
                  >
                    {project.status}
                  </span>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors">
                  {project.status === "Đang chạy" ? "construction" : "check_circle"}
                </span>
              </div>
              <div className="space-y-stack-sm">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-label-md text-on-surface-variant">Tiến độ</span>
                  <span className="font-label-lg text-primary">{project.progress}%</span>
                </div>
                <div className="w-full bg-surface-container-highest h-3 border border-on-surface">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      project.status === "Đang chạy" ? "bg-primary-container" : "bg-on-secondary-fixed-variant"
                    }`}
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
                <div className="flex items-center gap-2 mt-4 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[18px]">group</span>
                  <span className="font-label-lg">{project.members} Thành viên</span>
                </div>
              </div>
            </div>
          ))
        )}

        {/* Image Card for Visual Interest */}
        <div className="relative overflow-hidden border-2 border-on-surface md:col-span-1 h-[180px]">
          <Image
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDnPbfwL-RIwldynojgp-7-CVm7AtjJnmhm1GsOI5YZzX2woDUux0X9veTq0JWnKwJ8MF0NRNV_yp6E-GdadUe_FqLULF-RtAgsKzhnAMM5RaF0B2TlIsvamnsScW-2u-VJom59P7Q4Zo2_PjI5m9C9AoxVcwZMIpmmO76n7mZjJN-P8vF6aapfsC9_HajCKojCg0p-wcxZoGm_xEHU7nNcTA-er9uM6KIDIaJ9r311QbpbEhs5gLyY_ll6h38aWBGlcrVbIOd7HHk"
            alt="Overview"
            fill
            className="object-cover"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-on-surface/80 to-transparent flex items-end p-stack-md">
            <p className="text-white font-label-lg">Tổng quan hàng ngày: TBC Khu vực 4</p>
          </div>
        </div>
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary-container text-on-primary-container flex items-center justify-center rounded-none shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all z-40"
      >
        <span className="material-symbols-outlined text-[32px] font-bold">add</span>
      </button>

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface w-full max-w-md border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] animate-in zoom-in-95">
            <div className="p-4 border-b-2 border-on-surface flex justify-between items-center bg-surface-container">
              <h2 className="font-headline-sm text-headline-sm uppercase">Dự án mới</h2>
              <button onClick={() => setIsModalOpen(false)} className="hover:text-error transition-colors">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form 
              className="p-4 space-y-4"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                const formData = new FormData(e.currentTarget);
                const newProject = {
                  id: crypto.randomUUID(),
                  name: formData.get('name'),
                  status: formData.get('status'),
                  progress: Number(formData.get('progress')),
                  members: Number(formData.get('members'))
                };

                const { error } = await supabase.from('projects').insert(newProject);
                setIsSubmitting(false);

                if (error) {
                  alert('Lỗi khi thêm dự án: ' + error.message);
                } else {
                  queryClient.invalidateQueries({ queryKey: ['projects'] });
                  queryClient.invalidateQueries({ queryKey: ['active_projects_count'] });
                  setIsModalOpen(false);
                }
              }}
            >
              <div className="space-y-2">
                <label className="font-label-md text-on-surface-variant uppercase">Tên dự án</label>
                <input name="name" required className="w-full h-12 px-3 border-2 border-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary" placeholder="Ví dụ: Kè bờ sông A..." />
              </div>
              <div className="space-y-2">
                <label className="font-label-md text-on-surface-variant uppercase">Trạng thái</label>
                <select name="status" className="w-full h-12 px-3 border-2 border-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary appearance-none rounded-none">
                  <option value="Đang chạy">Đang chạy</option>
                  <option value="Hoàn thành">Hoàn thành</option>
                </select>
              </div>
              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label className="font-label-md text-on-surface-variant uppercase">Tiến độ (%)</label>
                  <input name="progress" type="number" required min="0" max="100" defaultValue="0" className="w-full h-12 px-3 border-2 border-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-2 flex-1">
                  <label className="font-label-md text-on-surface-variant uppercase">Thành viên</label>
                  <input name="members" type="number" required min="1" defaultValue="1" className="w-full h-12 px-3 border-2 border-on-surface bg-surface-container-lowest focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="pt-4">
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full h-12 bg-primary text-white font-bold text-label-lg border-2 border-on-surface flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
                >
                  {isSubmitting ? 'ĐANG LƯU...' : 'LƯU DỰ ÁN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
