import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Crown, Moon, ChevronRight, Package, Tag, Layers } from "lucide-react";
import { Link } from "react-router-dom";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface MegaMenuProps {
  isOpen: boolean;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onClose: () => void;
}

const MegaMenu = ({ isOpen, onMouseEnter, onMouseLeave, onClose }: MegaMenuProps) => {
  const [categories, setCategories] = useState<string[]>([]);
  const [subCategories, setSubCategories] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "metadata", "categories"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setCategories(data.list || []);
        setSubCategories(data.subs || {});
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const getIcon = (index: number) => {
    const icons = [
      <Sparkles className="w-4 h-4 text-[#B0843D]" />,
      <Crown className="w-4 h-4 text-[#B0843D]" />,
      <Moon className="w-4 h-4 text-[#B0843D]" />,
      <Layers className="w-4 h-4 text-[#B0843D]" />,
      <Package className="w-4 h-4 text-[#B0843D]" />,
      <Tag className="w-4 h-4 text-[#B0843D]" />
    ];
    return icons[index % icons.length];
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          className="absolute top-[100%] left-0 right-0 bg-[#FDFCFB] border-b border-[#B0843D]/10 shadow-[0_40px_80px_rgba(49,1,1,0.15)] z-[60] overflow-hidden"
        >
          <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 py-16">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-12">
              {categories.map((cat, idx) => (
                <div key={cat} className="space-y-6 group/col">
                  <Link 
                    to={`/shop?category=${encodeURIComponent(cat.toLowerCase())}`}
                    onClick={onClose}
                    className="flex items-center gap-3 border-b border-[#310101]/10 pb-4 group/head"
                  >
                    <div className="p-2 bg-[#F9F6F2] rounded-lg group-hover/head:bg-[#310101] group-hover/head:text-[#E5D5C5] transition-colors duration-500">
                       {getIcon(idx)}
                    </div>
                    <div>
                      <h3 className="font-serif text-[15px] uppercase tracking-[0.2em] font-black text-[#310101] group-hover/head:text-[#B0843D] transition-colors">
                        {cat}
                      </h3>
                      <p className="text-[14px] text-[#B0843D] font-black uppercase tracking-widest opacity-40">Collection</p>
                    </div>
                  </Link>
                  <ul className="space-y-4">
                    {(subCategories[cat] || ["General Selection"]).map((sub) => (
                      <li key={sub} className="group/item flex items-center gap-3">
                        <div className="w-1.5 h-[1px] bg-[#B0843D]/20 group-hover/item:w-4 group-hover/item:bg-[#B0843D] transition-all duration-300" />
                        <Link 
                          to={`/shop?category=${encodeURIComponent(cat.toLowerCase())}&subcategory=${encodeURIComponent(sub.toLowerCase())}`}
                          onClick={onClose}
                          className="text-[#310101] font-sans text-[14px] font-bold tracking-wide hover:text-[#B0843D] transition-colors inline-block uppercase"
                        >
                          {sub}
                        </Link>
                      </li>
                    ))}
                    <li className="pt-2">
                       <Link 
                         to={`/shop?category=${encodeURIComponent(cat.toLowerCase())}`}
                         onClick={onClose}
                         className="text-[14px] font-black uppercase tracking-widest text-[#B0843D]/90 hover:text-[#310101] transition-colors flex items-center gap-2"
                       >
                         View All {cat} <ChevronRight className="w-3 h-3" />
                       </Link>
                    </li>
                  </ul>
                </div>
              ))}
            </div>
            
            <div className="mt-16 pt-10 border-t border-[#310101]/5 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="flex items-center gap-8">
                <div className="hidden md:flex flex-col">
                   <p className="text-[14px] font-black text-[#310101]/80 uppercase tracking-[0.2em]">Heritage Curation</p>
                   <p className="text-sm font-serif italic text-[#310101]">Hand-picked excellence by Kaleemiya</p>
                </div>
                <div className="h-10 w-[1px] bg-[#310101]/10 hidden md:block" />
                <div className="flex flex-wrap gap-4">
                  {[
                    { name: "New Arrivals", slug: "new arrival" },
                    { name: "Bestsellers", slug: "our bestseller" },
                    { name: "Limited Edition", slug: "limited edition" }
                  ].map(tag => (
                    <Link 
                      key={tag.name}
                      to={`/shop?category=${encodeURIComponent(tag.slug)}`}
                      onClick={onClose}
                      className="px-5 py-2 rounded-full border border-[#B0843D]/20 text-[14px] font-black uppercase tracking-wider text-[#310101] hover:bg-[#310101] hover:text-[#E5D5C5] transition-all duration-300"
                    >
                      {tag.name}
                    </Link>
                  ))}
                </div>
              </div>
              <Link 
                to="/shop" 
                onClick={onClose}
                className="group flex items-center gap-4 bg-[#310101] text-[#E5D5C5] px-10 py-5 rounded-full shadow-2xl hover:scale-105 transition-all duration-500"
              >
                <span className="text-[14px] font-black uppercase tracking-[0.2em]">Explore Entire Signature</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MegaMenu;
