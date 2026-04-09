import { useState, useRef } from "react";
import { useProducts } from "@/hooks/useProducts";
import { Product } from "@/data/products";
import SectionHeading from "./SectionHeading";
import ProductCard from "./ProductCard";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";


const tabs = ["Under ₹2,000", "₹2,000 – ₹5,000", "Premium"];



const ShopByPrice = () => {
  const [active, setActive] = useState("Under ₹2,000");
  const scrollRef = useRef<HTMLDivElement>(null);
  const { products: allProducts } = useProducts();

  const filteredProducts = allProducts.filter(p => {
    if (active === "Under ₹2,000") return p.numericPrice < 2000;
    if (active === "₹2,000 – ₹5,000") return p.numericPrice >= 2000 && p.numericPrice <= 5000;
    if (active === "Premium") return p.numericPrice > 5000;
    return false;
  }).slice(0, 5);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -320 : 320,
      behavior: "smooth",
    });
  };

  return (
    <section className="section-padding">
      <SectionHeading title="Shop by Price" subtitle="Luxury at every price point" />

      <div className="flex justify-center flex-wrap gap-2 md:gap-4 mb-10 px-4">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActive(tab)}
            className={`px-4 py-1.5 rounded-full text-[8.5px] md:text-[11px] font-sans font-bold tracking-[0.15em] uppercase transition-all duration-300 border ${
              active === tab
                ? "bg-primary border-primary text-white shadow-lg shadow-primary/20"
                : "bg-transparent border-primary/20 text-foreground/60 hover:border-primary/40 hover:text-primary"
            }`}
          >
            {tab.replace("–", "-")}
          </button>
        ))}
      </div>

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={active}
            ref={scrollRef}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="flex gap-8 overflow-x-auto pb-8 snap-x snap-mandatory px-8 md:px-0 md:justify-center scrollbar-hide"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {filteredProducts.map((p, i) => (
              <div key={`${p.id}-${i}`} className="snap-center shrink-0 w-[85vw] sm:w-[280px] md:w-[300px] flex justify-center">
                <ProductCard {...p} />
              </div>
            ))}
          </motion.div>
        </AnimatePresence>

        {/* Scroll buttons */}
        <button
          onClick={() => scroll("left")}
          className="absolute left-2 md:left-0 top-[40%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 md:bg-muted/80 backdrop-blur flex items-center justify-center text-foreground/60 hover:text-primary hover:bg-muted transition-all duration-300 md:-translate-x-2 md:hidden"
          aria-label="Scroll left"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={() => scroll("right")}
          className="absolute right-2 md:right-0 top-[40%] -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-background/80 md:bg-muted/80 backdrop-blur flex items-center justify-center text-foreground/60 hover:text-primary hover:bg-muted transition-all duration-300 md:translate-x-2 md:hidden"
          aria-label="Scroll right"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>

      <div className="mt-12 flex justify-center px-4 sm:px-0">
        <Link 
          to="/shop" 
          className="group relative w-full sm:w-auto min-w-[280px] max-w-xs sm:max-w-none px-10 py-4 bg-[#310101] border border-[#310101] hover:bg-transparent hover:text-[#310101] transition-all duration-500 rounded-full overflow-hidden flex items-center justify-center shadow-lg"
        >
          <div className="absolute inset-0 bg-white translate-x-full group-hover:translate-x-0 transition-transform duration-500" />
          <span className="relative text-[13px] font-black uppercase tracking-[0.3em] text-white group-hover:text-[#310101]">Explore Full Collection</span>
        </Link>
      </div>
    </section>
  );
};

export default ShopByPrice;
