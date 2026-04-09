import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";
import { useProducts } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";


const NewArrivalsSection = () => {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { products } = useProducts();
  const newArrivals = products.filter(p => p.isLive !== false && p.isNew).slice(0, 5);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: dir === "left" ? -320 : 320, behavior: "smooth" });
  };

  return (
    <section className="section-padding overflow-hidden bg-background">
      <SectionHeading title="New Arrivals" subtitle="The latest additions to our collection" />

      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-8 overflow-x-auto pb-4 px-8 md:px-0 md:justify-center scrollbar-hide snap-x snap-mandatory md:snap-none"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {newArrivals.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="snap-center shrink-0 w-[85vw] sm:w-[280px] md:w-[300px]"
            >
              <ProductCard {...p} category={p.category} subCategory={p.subCategory} />
            </motion.div>
          ))}
        </div>

        <button onClick={() => scroll("left")} className="absolute left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 md:bg-muted/80 backdrop-blur flex items-center justify-center text-foreground/60 hover:text-primary transition-all md:-translate-x-2 md:hidden" aria-label="Scroll left">
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button onClick={() => scroll("right")} className="absolute right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 md:bg-muted/80 backdrop-blur flex items-center justify-center text-foreground/60 hover:text-primary transition-all md:translate-x-2 md:hidden" aria-label="Scroll right">
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-12 flex justify-center px-4 sm:px-0">
        <button 
          onClick={() => navigate("/shop?category=newarrival")}
          className="group relative w-full sm:w-auto min-w-[280px] max-w-xs sm:max-w-none px-10 py-4 bg-white border border-[#310101]/10 hover:border-[#310101] transition-all duration-500 rounded-full overflow-hidden shadow-sm flex items-center justify-center"
        >
          <div className="absolute inset-0 bg-[#310101]/5 -translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
          <span className="relative text-[13px] font-black uppercase tracking-[0.3em] text-[#310101]">Explore All New Arrivals</span>
        </button>
      </div>
    </section>
  );
};

export default NewArrivalsSection;
