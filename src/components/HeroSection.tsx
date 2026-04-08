import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { ChevronLeft, ChevronRight } from "lucide-react";
import heroPerfume from "@/assets/hero-perfume.jpg";

const HeroSection = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "hero_slides"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSlides(data);
    });
    return () => unsub();
  }, []);

  const fixedLeadSlide = {
    id: "essence-of-purity-lead",
    image: heroPerfume,
    displayMode: "contain",
    titleFirstLine: "Experience the",
    titleHighlight: "Essence",
    titleLastLine: "of Purity",
    subtitle: "Inspired by tradition, crafted with elegance. Pure attars and oud fragrances for the discerning soul.",
    buttonText: "Explore Collection",
    link: "/shop"
  };

  // Admin slides follow the fixed brand slide
  const activeSlides = [fixedLeadSlide, ...slides];

  useEffect(() => {
    if (activeSlides.length > 1) {
      const timer = setInterval(() => {
        setCurrent((prev) => (prev + 1) % activeSlides.length);
      }, 7000);
      return () => clearInterval(timer);
    }
  }, [activeSlides.length]);

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + activeSlides.length) % activeSlides.length);
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % activeSlides.length);
  };

  const currentSlide = activeSlides[current] || activeSlides[0];

  return (
    <section 
      style={{ backgroundColor: currentSlide.backgroundColor || "#0a0a0a" }}
      className="relative w-full min-h-[75vh] md:min-h-[85vh] lg:min-h-[90vh] flex items-center overflow-hidden transition-colors duration-1000"
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 z-0"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent z-[2]" />
          
          {currentSlide.displayMode === "contain" && (
            <img
              src={currentSlide.image}
              alt=""
              className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-30 scale-110"
              aria-hidden="true"
            />
          )}

          {(currentSlide.video || (typeof currentSlide.image === 'string' && currentSlide.image.toLowerCase().match(/\.(mp4|mov|webm|quicktime)$|video\/upload/))) ? (
            <motion.video
              src={currentSlide.video || currentSlide.image}
              autoPlay
              muted
              loop
              playsInline
              className={`relative w-full h-full ${currentSlide.displayMode === "contain" ? "object-contain" : "object-cover"} z-[1]`}
              style={{ 
                objectPosition: currentSlide.objectPosition || "center",
                scale: currentSlide.imageScale || 1.1
              }}
              animate={{ scale: (currentSlide.imageScale || 1.1) * 1.03 }}
              transition={{ duration: 12, ease: "linear" }}
            />
          ) : (
            <motion.img
              src={currentSlide.image}
              alt="Hero Slide"
              className={`relative w-full h-full ${currentSlide.displayMode === "contain" ? "object-contain" : "object-cover"} z-[1]`}
              style={{ 
                objectPosition: currentSlide.objectPosition || "center",
                scale: currentSlide.imageScale || 1.1
              }}
              animate={{ scale: (currentSlide.imageScale || 1.1) * 1.03 }}
              transition={{ duration: 12, ease: "linear" }}
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="boutique-container relative z-10 w-full px-16 lg:px-24 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-xl lg:max-w-2xl pointer-events-auto"
          >
            <motion.h2
              className="hero-title-responsive font-serif font-medium mb-4 text-white tracking-tight leading-[1.1] md:leading-[1]"
            >
              {currentSlide.titleFirstLine}
              <br />
              <span className="gold-gradient-text font-medium">{currentSlide.titleHighlight}</span> {currentSlide.titleLastLine}
            </motion.h2>

            <motion.p
              className="hero-subtitle-responsive text-white/80 font-sans max-w-lg mb-8 leading-relaxed opacity-90"
            >
              {currentSlide.subtitle}
            </motion.p>
            
            <Link to={currentSlide.link} className="inline-block">
              <Button className="bg-[#B0843D] text-[#310101] hover:bg-[#C29B5D] px-8 py-7 md:px-12 md:py-8 text-[11px] md:text-[13px] font-bold uppercase tracking-widest transition-all duration-300 shadow-[0_0_40px_rgba(176,132,61,0.2)] hover:shadow-[0_0_60px_rgba(176,132,61,0.4)]">
                {currentSlide.buttonText}
              </Button>
            </Link>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Manual Navigation Arrows - Desktop Only */}
      {activeSlides.length > 1 && (
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 w-full px-2 md:px-4 hidden md:flex justify-between pointer-events-none">
          <button 
            onClick={handlePrev}
            className="pointer-events-auto w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/30 hover:text-[#B0843D] hover:bg-white/10 hover:border-[#B0843D]/30 hover:scale-110 active:scale-90 transition-all shadow-xl"
          >
            <ChevronLeft className="w-5 h-5 md:w-7 md:h-7" />
          </button>
          <button 
            onClick={handleNext}
            className="pointer-events-auto w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/30 hover:text-[#B0843D] hover:bg-white/10 hover:border-[#B0843D]/30 hover:scale-110 active:scale-90 transition-all shadow-xl"
          >
            <ChevronRight className="w-5 h-5 md:w-7 md:h-7" />
          </button>
        </div>
      )}

      {/* Slider Indicator Line - Smooth Moving */}
      {activeSlides.length > 1 && (
        <div className="absolute bottom-10 left-12 sm:left-16 md:left-24 z-30 flex items-center gap-2">
          {activeSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="py-2 focus:outline-none group"
            >
              <div className={`h-[2px] transition-all duration-700 ease-out rounded-full ${
                i === current ? 'w-12 md:w-16 bg-[#B0843D]' : 'w-4 md:w-6 bg-white/20 group-hover:bg-white/40'
              }`} />
            </button>
          ))}
          <div className="ml-4 flex items-center font-sans text-[10px] md:text-[12px] font-bold text-white/40 tracking-[0.2em] uppercase">
            <span className="text-white">0{current + 1}</span>
            <span className="mx-2 opacity-20">/</span>
            <span>0{activeSlides.length}</span>
          </div>
        </div>
      )}

    </section>
  );
};

export default HeroSection;
