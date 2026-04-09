import { useRef } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import ProductCard from "./ProductCard";
import SectionHeading from "./SectionHeading";
import { useProducts } from "@/hooks/useProducts";




const BestsellersSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const { products } = useProducts();
  const bestsellers = products.filter(p => p.isLive !== false && p.isBestseller);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  return (
    <section className="section-padding overflow-hidden bg-background">
      <SectionHeading title="Our Bestsellers" subtitle="Timeless fragrances loved by connoisseurs worldwide" light={false} />

      <div className="relative z-10">
        <div
          ref={scrollRef}
          className="flex gap-4 md:gap-8 overflow-x-auto pb-8 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {bestsellers.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.1 }}
              transition={{ duration: 0.5, delay: i * 0.05 }}
              className="snap-center shrink-0 w-[85vw] sm:w-[280px] md:w-[300px]"
            >
              <ProductCard {...p} category={p.category} subCategory={p.subCategory} />
            </motion.div>
          ))}
        </div>

        {/* Scroll buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 md:left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 md:bg-muted/80 backdrop-blur flex items-center justify-center text-foreground/60 hover:text-primary hover:bg-muted transition-all duration-300 md:-translate-x-2"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 md:right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 md:bg-muted/80 backdrop-blur flex items-center justify-center text-foreground/60 hover:text-primary hover:bg-muted transition-all duration-300 md:translate-x-2"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-12 flex justify-center px-4 sm:px-0">
        <Link 
          to="/shop?category=ourbestseller" 
          className="group relative w-full sm:w-auto min-w-[280px] max-w-xs sm:max-w-none px-10 py-4 bg-[#310101] border border-[#310101] hover:bg-transparent hover:text-[#310101] transition-all duration-500 rounded-full overflow-hidden flex items-center justify-center shadow-lg"
        >
          <div className="absolute inset-0 bg-white translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
          <span className="relative text-[13px] font-black uppercase tracking-[0.2em] text-white group-hover:text-[#310101]">View All Bestsellers</span>
        </Link>
      </div>
    </section>
  );
};

export default BestsellersSection;
