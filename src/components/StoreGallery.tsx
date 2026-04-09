import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import store1 from "@/assets/store-1.jpg";
import store2 from "@/assets/store-2.jpg";
import store3 from "@/assets/store-3.jpg";
import store5 from "@/assets/store-5.jpg";
import store6 from "@/assets/store-6.jpg";
import store7 from "@/assets/store-7.jpg";
import store8 from "@/assets/store-8.jpg";
import store9 from "@/assets/store-9.jpg";
import store10 from "@/assets/store-10.jpg";
import store11 from "@/assets/store-11.jpg";
import store12 from "@/assets/store-12.jpg";
import store14 from "@/assets/store-14.jpg";
import store15 from "@/assets/store-15.jpg";
import store16 from "@/assets/store-16.jpg";
import store17 from "@/assets/store-17.jpg";
import store18 from "@/assets/store-18.jpg";
import store19 from "@/assets/store-19.jpg";
import store20 from "@/assets/store-20.jpg";

const DEFAULT_GALLERY = [
  { src: store15, alt: "Kaleemiya Signature Front View" },
  { src: store16, alt: "Signature Shop Counter with Jars" },
  { src: store17, alt: "Ornate Mosque & Kaaba Models" },
  { src: store18, alt: "Crystal Arabic Calligraphy" },
  { src: store19, alt: "Decorative Star Trays" },
  { src: store20, alt: "Backlit Perfume Display Shelves" },
  { src: store10, alt: "Premium Perfume & Gifting" },
  { src: store11, alt: "Elegant Floral Signature Decor" },
  { src: store14, alt: "Artisan Fragrance Wall Dispensers" },
  { src: store12, alt: "Wide Signature Side View" },
  { src: store2, alt: "Luxury Perfume Collection" },
  { src: store3, alt: "Artisan Fragrances" },
  { src: store5, alt: "Exquisite Fragrance Oils" },
];

const StoreGallery = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [galleryImages, setGalleryImages] = useState(DEFAULT_GALLERY);

  useEffect(() => {
    const q = query(collection(db, "gallery"));
    const unsub = onSnapshot(q, (snap) => {
      if (!snap.empty) {
        const fetched = snap.docs.map(doc => ({ 
          src: doc.data().src, 
          alt: doc.data().alt || "Kaleemiya Signature" 
        }));
        
        // Sorting by Firestore order or date if available
        const sorted = fetched.sort((a, b) => {
            return (b as any).createdAt - (a as any).createdAt;
        });

        setGalleryImages(sorted);
      } else {
        setGalleryImages(DEFAULT_GALLERY);
      }
    });

    return () => unsub();
  }, []);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    document.body.style.overflow = "auto";
  };

  const showNext = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % galleryImages.length);
    }
  }, [selectedIndex, galleryImages.length]);

  const showPrev = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + galleryImages.length) % galleryImages.length);
    }
  }, [selectedIndex, galleryImages.length]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (selectedIndex === null) return;
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
      if (e.key === "Escape") closeLightbox();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, showNext, showPrev]);

  return (
    <section className="section-padding overflow-hidden bg-[#310101]">
      <div className="max-w-[1440px] mx-auto">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-[#B0843D] font-sans text-sm uppercase tracking-[0.3em] font-bold mb-4 block"
          >
            Our Signature
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl md:text-4xl lg:text-5xl text-white"
          >
            Visit the World of Kaleemiya
          </motion.h2>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: 80 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-[1px] bg-[#B0843D] mx-auto mt-6"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6">
          {galleryImages.map((image, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: (index % 6) * 0.1 }}
              onClick={() => openLightbox(index)}
              className={cn(
                "relative group overflow-hidden rounded-sm cursor-pointer aspect-square bg-muted/20",
                index === 0 && "col-span-2 row-span-2 aspect-[1/1] md:aspect-auto"
              )}
            >
              {(image.src && (typeof image.src === 'string' && image.src.toLowerCase().match(/\.(mp4|mov|webm|quicktime)$|video\/upload/))) ? (
                <video 
                  src={image.src} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  muted loop playsInline onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()}
                />
              ) : (
                <img 
                  src={image.src} 
                  alt={image.alt} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-500 flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="p-3 rounded-full bg-white/20 backdrop-blur-md">
                  <ChevronRight size={20} className="text-white" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {selectedIndex !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm p-4 md:p-10"
            onClick={closeLightbox}
          >
            <motion.button
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-[101]"
              onClick={closeLightbox}
            >
              <X size={32} />
            </motion.button>

            <button
              className="absolute left-4 md:left-10 text-white/70 hover:text-white transition-colors z-[101]"
              onClick={showPrev}
            >
              <ChevronLeft size={48} />
            </button>

            <button
              className="absolute right-4 md:right-10 text-white/70 hover:text-white transition-colors z-[101]"
              onClick={showNext}
            >
              <ChevronRight size={48} />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full h-full flex items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {(galleryImages[selectedIndex].src && (typeof galleryImages[selectedIndex].src === 'string' && galleryImages[selectedIndex].src.toLowerCase().match(/\.(mp4|mov|webm|quicktime)$|video\/upload/))) ? (
                <video
                  src={galleryImages[selectedIndex].src}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                  controls autoPlay loop
                />
              ) : (
                <img
                  src={galleryImages[selectedIndex].src}
                  alt={galleryImages[selectedIndex].alt}
                  className="max-w-full max-h-full object-contain shadow-2xl rounded-sm"
                />
              )}
              <div className="absolute bottom-[-40px] left-0 right-0 text-center text-white/70 text-sm font-sans tracking-widest uppercase">
                {selectedIndex + 1} / {galleryImages.length} — {galleryImages[selectedIndex].alt}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

export default StoreGallery;
