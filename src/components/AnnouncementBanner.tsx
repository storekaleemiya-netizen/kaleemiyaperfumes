import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot, doc } from "firebase/firestore";
import { X, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const AnnouncementBanner = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [rotateEnabled, setRotateEnabled] = useState(true);
  const navigate = useNavigate();

  // Real-time listener for global store settings
  useEffect(() => {
    const unsub = onSnapshot(doc(db, "metadata", "settings"), (snap) => {
      if (snap.exists()) {
        const settings = snap.data();
        setRotateEnabled(settings.rotateAnnouncements !== false);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, "news"), 
      orderBy("date", "desc")
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const allNews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as any }));
      const now = new Date();
      now.setHours(0, 0, 0, 0);

      const activeList = allNews.filter(item => {
        const start = item.startDate ? new Date(item.startDate) : null;
        const end = item.endDate ? new Date(item.endDate) : null;
        if (start) start.setHours(0, 0, 0, 0);
        if (end) end.setHours(23, 59, 59, 999);
        return (!start || now >= start) && (!end || now <= end);
      });

      setAnnouncements(activeList);
    });

    return () => unsub();
  }, []);

  const handleBannerClick = (announcement: any) => {
    let path = "/shop";
    const params = new URLSearchParams();
    if (announcement.targetCategory && announcement.targetCategory !== "All") params.append("category", announcement.targetCategory);
    if (announcement.targetSubCategory && announcement.targetSubCategory !== "All") params.append("subcategory", announcement.targetSubCategory);
    if (announcement.discountPercent) params.append("discount", announcement.discountPercent);
    const queryString = params.toString();
    navigate(queryString ? `${path}?${queryString}` : path);
  };

  if (announcements.length === 0 || !isVisible) return null;

  // Duplicate items for a truly seamless loop
  const displayItems = [...announcements, ...announcements, ...announcements];

  return (
    <div className="relative z-[60] group bg-[#310101] h-9 sm:h-11 flex items-center overflow-hidden">
      {/* Premium Marquee Logic using CSS for hardware acceleration */}
      <style>{`
        @keyframes luxury-marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-33.333%); }
        }
        .animate-luxury-marquee {
          animation: luxury-marquee 25s linear infinite;
        }
        .group:hover .animate-luxury-marquee {
          animation-play-state: paused;
        }
      `}</style>

      <div className="w-full flex items-center relative h-full">
        {/* The Edge Fade Gradients (Luxury UI) */}
        <div className="absolute left-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-r from-[#310101] to-transparent z-20 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-12 sm:w-24 bg-gradient-to-l from-[#310101] to-transparent z-20 pointer-events-none" />

        <div className="flex whitespace-nowrap animate-luxury-marquee hover:cursor-pointer">
          {displayItems.map((item, idx) => (
            <div 
              key={`${item.id}-${idx}`} 
              onClick={() => handleBannerClick(item)}
              className="flex items-center gap-12 sm:gap-24 px-6 sm:px-12 py-1"
            >
              <div className="flex items-center gap-3 sm:gap-4">
                <Sparkles className="w-3.5 h-3.5 text-[#B0843D] animate-pulse" />
                <span className="text-[10px] sm:text-[12px] md:text-[14px] font-black uppercase tracking-[0.25em] sm:tracking-[0.4em] text-[#F3E5D8]">
                  {item.title}
                </span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#B0843D]/30 shrink-0" />
                <span className="text-[10px] sm:text-[12px] md:text-[13.5px] font-serif italic text-[#B0843D] font-bold tracking-wider">
                  {item.content}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Close Button */}
        <button 
          onClick={(e) => { e.stopPropagation(); setIsVisible(false); }}
          className="absolute right-3 sm:right-6 z-30 p-1.5 rounded-full hover:bg-white/10 transition-colors bg-[#310101]/60 backdrop-blur-md border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <X className="w-3.5 h-3.5 text-white/50 hover:text-white" />
        </button>
      </div>
    </div>
  );
};

export default AnnouncementBanner;
