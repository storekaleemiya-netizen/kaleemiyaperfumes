import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DRAG_THRESHOLD = 50;

const HeroSection = () => {
  const [slides, setSlides] = useState<any[]>([]);
  const [activeSlides, setActiveSlides] = useState<any[]>([]);
  // 'current' is the logical index in activeSlides (0 to length-1)
  const [current, setCurrent] = useState(0);
  // 'trackIndex' is the physical index in the displaySlides array
  const [trackIndex, setTrackIndex] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const controls = useAnimation();
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const q = query(collection(db, "hero_slides"), orderBy("order", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setSlides(data);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const filtered = slides.filter(slide => {
      if (isMobile) return slide.mobileImage || slide.mobileVideo;
      return slide.image || slide.video;
    });
    setActiveSlides(filtered);
    // Reset to first slide on data change
    if (filtered.length > 0) {
      setTrackIndex(1);
      setCurrent(0);
    }
  }, [slides, isMobile]);

  // The infinite track: [Last, Slide1, Slide2, ..., SlideN, First]
  const displaySlides = activeSlides.length > 0 
    ? [activeSlides[activeSlides.length - 1], ...activeSlides, activeSlides[0]]
    : [];

  const handleJump = useCallback((index: number) => {
    setIsTransitioning(false);
    setTrackIndex(index);
    // When jumping, we map trackIndex to current logical index
    if (index === 0) setCurrent(activeSlides.length - 1);
    else if (index === activeSlides.length + 1) setCurrent(0);
    else setCurrent(index - 1);
  }, [activeSlides.length]);

  const handleNext = useCallback(() => {
    if (isTransitioning || activeSlides.length <= 1) return;
    setIsTransitioning(true);
    setTrackIndex(prev => prev + 1);
    setCurrent(prev => (prev + 1) % activeSlides.length);
  }, [isTransitioning, activeSlides.length]);

  const handlePrev = useCallback(() => {
    if (isTransitioning || activeSlides.length <= 1) return;
    setIsTransitioning(true);
    setTrackIndex(prev => prev - 1);
    setCurrent(prev => (prev - 1 + activeSlides.length) % activeSlides.length);
  }, [isTransitioning, activeSlides.length]);

  useEffect(() => {
    if (activeSlides.length > 1 && !isDragging) {
      autoPlayRef.current = setInterval(handleNext, 7000);
      return () => {
        if (autoPlayRef.current) clearInterval(autoPlayRef.current);
      };
    }
  }, [handleNext, activeSlides.length, isDragging]);

  const onTransitionEnd = () => {
    setIsTransitioning(false);
    if (trackIndex === 0) {
      handleJump(activeSlides.length);
    } else if (trackIndex === activeSlides.length + 1) {
      handleJump(1);
    }
  };

  const isVideo = (url: string) => {
    if (!url) return false;
    return url.toLowerCase().match(/\.(mp4|mov|webm|quicktime|m4v)$/) || url.includes("video/upload");
  };

  if (activeSlides.length === 0) return null;

  const currentSlide = activeSlides[current];

  return (
    <section className="relative w-full aspect-[4/5] md:aspect-auto md:h-[85vh] lg:h-[90vh] flex items-center overflow-hidden bg-black">
      {/* Infinite Track */}
      <motion.div
        className="absolute inset-0 flex touch-pan-y"
        animate={{ x: `-${trackIndex * 100}%` }}
        transition={isTransitioning ? { duration: 0.8, ease: [0.16, 1, 0.3, 1] } : { duration: 0 }}
        onAnimationComplete={onTransitionEnd}
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.4}
        onDragStart={() => {
          setIsDragging(true);
          if (autoPlayRef.current) clearInterval(autoPlayRef.current);
        }}
        onDragEnd={(_, info) => {
          setIsDragging(false);
          if (info.offset.x > DRAG_THRESHOLD) handlePrev();
          else if (info.offset.x < -DRAG_THRESHOLD) handleNext();
        }}
      >
        {displaySlides.map((slide, index) => {
          const currentImg = isMobile ? (slide.mobileImage || slide.image) : (slide.image || slide.mobileImage);
          const currentVid = isMobile ? (slide.mobileVideo || slide.video) : (slide.video || slide.mobileVideo);

          return (
            <div key={`${slide.id}-${index}`} className="relative min-w-full h-full flex items-center overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent z-[2]" />
               {(currentVid || isVideo(currentImg)) ? (
                  <video
                    src={currentVid || currentImg}
                    autoPlay muted loop playsInline
                    className="relative w-full h-full object-contain z-[1]"
                    style={{ objectPosition: slide.objectPosition || "center" }}
                  />
               ) : (
                  <img
                    src={currentImg}
                    alt=""
                    className="relative w-full h-full object-contain z-[1]"
                    style={{ objectPosition: slide.objectPosition || "center" }}
                  />
               )}
            </div>
          );
        })}
      </motion.div>

      {/* Content Layer */}
      <div className="Signature-container relative z-10 w-full px-6 sm:px-12 md:px-16 lg:px-24 pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.6 }}
            className="max-w-xl lg:max-w-2xl pointer-events-auto"
          >
            {(currentSlide?.titleFirstLine || currentSlide?.titleHighlight || currentSlide?.titleLastLine) && (
              <h2 className="hero-title-responsive font-serif font-medium mb-4 text-white tracking-tight leading-[1.1] md:leading-[1]">
                {currentSlide.titleFirstLine}
                {currentSlide.titleFirstLine && <br />}
                <span className="gold-gradient-text font-medium">{currentSlide.titleHighlight}</span> {currentSlide.titleLastLine}
              </h2>
            )}
            {currentSlide?.subtitle && (
              <p className="hero-subtitle-responsive text-white/80 font-sans max-w-lg mb-8 leading-relaxed opacity-90">
                {currentSlide.subtitle}
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      {activeSlides.length > 1 && (
        <>
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 z-30 w-full px-2 md:px-4 hidden md:flex justify-between pointer-events-none">
            <button onClick={handlePrev} className="pointer-events-auto w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/30 hover:text-[#B0843D] hover:bg-white/10 transition-all shadow-xl">
              <ChevronLeft className="w-5 h-5 md:w-7 md:h-7" />
            </button>
            <button onClick={handleNext} className="pointer-events-auto w-10 h-10 md:w-14 md:h-14 flex items-center justify-center rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-white/30 hover:text-[#B0843D] hover:bg-white/10 transition-all shadow-xl">
              <ChevronRight className="w-5 h-5 md:w-7 md:h-7" />
            </button>
          </div>
          <div className="absolute bottom-10 left-6 sm:left-12 md:left-24 z-30 flex items-center gap-2">
            {activeSlides.map((_, i) => (
              <button key={i} onClick={() => { setTrackIndex(i + 1); setCurrent(i); }} className="py-2 focus:outline-none group">
                <div className={`h-[2px] transition-all duration-700 ease-out rounded-full ${i === current ? 'w-12 md:w-16 bg-[#B0843D]' : 'w-4 md:w-6 bg-white/20 group-hover:bg-white/40'}`} />
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroSection;
