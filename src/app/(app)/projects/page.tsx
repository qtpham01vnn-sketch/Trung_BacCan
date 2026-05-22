"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

type Project = {
  id: string;
  name: string;
  status: "Đang chạy" | "Hoàn thành";
  progress: number;
  members: number;
  image_data?: string;
};

export default function ProjectsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [projectImageBase64, setProjectImageBase64] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new window.Image();
        img.src = reader.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 800; // Nén ảnh để lưu cho nhẹ
          const scaleSize = MAX_WIDTH / img.width;
          canvas.width = MAX_WIDTH;
          canvas.height = img.height * scaleSize;
          
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          
          const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);
          setProjectImageBase64(compressedBase64);
        };
      };
      reader.readAsDataURL(file);
    }
  };

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
          filteredProjects.map((project) => {
            const CONSTRUCTION_IMAGES = [
              "https://images.unsplash.com/photo-1541888081622-15cb3a58e803?q=80&w=600&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1503387762-592deb58ef4e?q=80&w=600&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1504307651254-35680f356dfd?q=80&w=600&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1589939705384-5185137a7f0f?q=80&w=600&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1508450859948-4e04fabaa4ea?q=80&w=600&auto=format&fit=crop"
            ];
            const imgIndex = project.id.charCodeAt(0) % CONSTRUCTION_IMAGES.length;
            // Dùng ảnh user up (image_data) nếu có, không thì xài ảnh mặc định
            const cardImg = project.image_data || CONSTRUCTION_IMAGES[imgIndex];

            return (
              <div
                key={project.id}
                className="bg-surface-container-lowest border-2 border-on-surface flex flex-col min-h-[260px] hover:border-primary-container transition-colors group overflow-hidden"
              >
                {/* Thumbnail Header */}
                <div 
                  className="relative h-40 w-full border-b-2 border-on-surface bg-surface-container-highest cursor-pointer"
                  onClick={() => setSelectedImage(cardImg)}
                >
                  <Image src={cardImg} alt={project.name} fill className="object-cover object-center transition-transform duration-700 group-hover:scale-105" unoptimized />
                  <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                  {/* Status Badge moved to top of image */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`inline-block px-3 py-1 font-label-md rounded-none text-white shadow-sm ${
                        project.status === "Đang chạy"
                          ? "bg-[#10b981]"
                          : "bg-on-surface"
                      }`}
                    >
                      {project.status}
                    </span>
                  </div>
                  {/* Zoom icon on hover */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-black/50 p-2 rounded-full text-white">
                      <span className="material-symbols-outlined">zoom_in</span>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="p-stack-md flex flex-col justify-between flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-headline-sm text-headline-sm text-on-surface line-clamp-2 pr-2">
                      {project.name}
                    </h3>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary-container transition-colors shrink-0">
                      {project.status === "Đang chạy" ? "construction" : "check_circle"}
                    </span>
                  </div>

                  <div className="space-y-stack-sm mt-auto">
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
              </div>
            );
          })
        )}
      </div>

      {/* Floating Action Button */}
      <button 
        onClick={() => {
          setProjectImageBase64("");
          setIsModalOpen(true);
        }}
        className="fixed bottom-24 right-6 w-14 h-14 bg-primary-container text-on-primary-container flex items-center justify-center rounded-none shadow-[4px_4px_0px_0px_rgba(25,28,30,1)] active:shadow-none active:translate-x-[2px] active:translate-y-[2px] transition-all z-40"
      >
        <span className="material-symbols-outlined text-[32px] font-bold">add</span>
      </button>

      {/* Add Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-surface w-full max-w-md border-2 border-on-surface shadow-[8px_8px_0px_0px_rgba(25,28,30,1)] animate-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="p-4 border-b-2 border-on-surface flex justify-between items-center bg-surface-container sticky top-0 z-10">
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
                  members: Number(formData.get('members')),
                  image_data: projectImageBase64 || null
                };

                const { error } = await supabase.from('projects').insert(newProject);
                setIsSubmitting(false);

                if (error) {
                  alert('Lỗi khi thêm dự án: Bạn cần tạo cột image_data (kiểu text) trong bảng projects trên Supabase trước khi up ảnh! Chi tiết: ' + error.message);
                } else {
                  queryClient.invalidateQueries({ queryKey: ['projects'] });
                  queryClient.invalidateQueries({ queryKey: ['active_projects_count'] });
                  setIsModalOpen(false);
                  setProjectImageBase64("");
                }
              }}
            >
              {/* Image Upload Field */}
              <div className="space-y-2">
                <label className="font-label-md text-on-surface-variant uppercase">Ảnh dự án (Tùy chọn)</label>
                <div 
                  className="w-full h-32 border-2 border-dashed border-on-surface bg-surface-container-lowest flex flex-col items-center justify-center cursor-pointer hover:bg-surface-container-low transition-colors relative overflow-hidden"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {projectImageBase64 ? (
                    <Image src={projectImageBase64} alt="Preview" fill className="object-cover" unoptimized />
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant mb-2">add_photo_alternate</span>
                      <span className="font-label-md text-on-surface-variant">Bấm để chọn ảnh</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                  />
                </div>
              </div>

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

      {/* Fullscreen Image Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4 cursor-pointer animate-in fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative w-full max-w-4xl aspect-[4/3] max-h-[80vh]">
            <Image 
              src={selectedImage} 
              alt="Phóng to" 
              fill 
              className="object-contain" 
              unoptimized 
            />
            <button 
              className="absolute top-4 right-4 bg-black/50 text-white p-2 rounded-full hover:bg-black/80 transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedImage(null);
              }}
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
