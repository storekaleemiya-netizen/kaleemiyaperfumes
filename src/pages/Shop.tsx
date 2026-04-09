import { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { SlidersHorizontal, ChevronDown, Package, LayoutGrid, Layers, Search as SearchIcon, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductCard from "@/components/ProductCard";
import { useProducts } from "@/hooks/useProducts";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

const categoriesArr = ["ALL", "MEN", "WOMEN", "UNISEX"] as const;
type Category = typeof categoriesArr[number];

const sortOptionsArr = ["Best selling", "Price: Low to High", "Price: High to Low", "Newest"] as const;
type SortOption = typeof sortOptionsArr[number];

interface ShopProps {
  title?: string;
  subtitle?: string;
  initialProductCategory?: "perfumes" | "attar" | "oud" | "giftsets" | "prayer mats" | "books" | "all";
  extraCategories?: string[];
  hideGenderFilters?: boolean;
}

const Shop = ({ 
  title = "Kaleemiya Signature", 
  subtitle = "Browse our complete catalog — from rare Attars and premium Ouds to curated Gift Sets and Prayer Mats.",
  initialProductCategory = "all",
  extraCategories = [],
  hideGenderFilters = false
}: ShopProps) => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("search");
  const urlCategory = searchParams.get("category")?.toLowerCase() || "";
  const urlSubCategory = searchParams.get("subcategory")?.toLowerCase() || "";
  const discountParam = searchParams.get("discount");
  
  const [activeGender, setActiveGender] = useState<Category>("ALL");
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [activeSubCategory, setActiveSubCategory] = useState<string>("all");
  const [activeSort, setActiveSort] = useState<SortOption>("Best selling");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const navigate = useNavigate();
  const { products: allProducts, loading: productsLoading } = useProducts();
  const [globalCategories, setGlobalCategories] = useState<string[]>([]);
  const [globalSubCategories, setGlobalSubCategories] = useState<Record<string, string[]>>({});

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "metadata", "categories"), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setGlobalCategories(data.list || []);
        setGlobalSubCategories(data.subs || {});
      }
    });
    return () => unsub();
  }, []);

  // Scroll to top when categories change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [activeCategory, activeGender, query]);

  // Sync initial category from props or URL - More Aggressive Sync
  useEffect(() => {
    if (urlCategory) {
      setActiveCategory(urlCategory);
    } else if (initialProductCategory && initialProductCategory !== "all") {
      setActiveCategory(initialProductCategory);
    } else {
      setActiveCategory("all");
    }
  }, [initialProductCategory, urlCategory]);

  // Sync sub-category from URL
  useEffect(() => {
    if (urlSubCategory) {
      const sub = urlSubCategory.toLowerCase();
      // If the subcategory is actually a gender term, set activeGender instead
      if (sub === "men") {
        setActiveGender("MEN");
        setActiveSubCategory("all");
      } else if (sub === "women") {
        setActiveGender("WOMEN");
        setActiveSubCategory("all");
      } else if (sub === "unisex") {
        setActiveGender("UNISEX");
        setActiveSubCategory("all");
      } else {
        setActiveSubCategory(urlSubCategory);
      }
    } else {
      setActiveSubCategory("all");
    }
  }, [urlSubCategory]);

  const filteredAndSortedProducts = useMemo(() => {
    let filtered = [...allProducts].filter(p => p.isLive !== false);

    // Filter by search query if present
    if (query) {
      const lowerQuery = query.toLowerCase();
      filtered = filtered.filter(p => 
        (p.name || "").toLowerCase().includes(lowerQuery) || 
        (p.category || "").toLowerCase().includes(lowerQuery)
      );
    }

    // Filter by type category or special tags
    // If we have a discount filter from the URL, we can be more global by default
    const hasDiscountParam = discountParam !== null;

    if (activeCategory !== "all" && !hasDiscountParam) {
      const lowerCat = activeCategory.toLowerCase();
      const normalizedTarget = lowerCat.replace(/\s+/g, "");
      
      if (normalizedTarget === "ourbestseller") {
        filtered = filtered.filter(p => p.isBestseller === true);
      } else if (normalizedTarget === "newarrival") {
        filtered = filtered.filter(p => p.isNew === true);
      } else {
        // Generalized inclusive filter for any category/subcategory name
        filtered = filtered.filter(p => {
           const pCat = (p.category || "").toLowerCase().replace(/\s+/g, "");
           const pSub = (p.subCategory || "").toLowerCase().replace(/\s+/g, "");
           
           // Special handling for Tasbeeh/Tasbhi synonyms
           const isTasbeehSearch = normalizedTarget === "tasbeeh" || normalizedTarget === "tasbhi";
           if (isTasbeehSearch) {
              return pCat === "tasbeeh" || pCat === "tasbhi" || 
                     pSub === "tasbeeh" || pSub === "tasbhi";
           }

           return pCat === normalizedTarget || pCat === lowerCat || 
                  pSub === normalizedTarget || pSub === lowerCat;
        });
      }

      // Further refined filter if a sub-category pill was selected
      if (activeSubCategory !== "all") {
         const targetSub = activeSubCategory.toLowerCase().replace(/\s+/g, "");
         filtered = filtered.filter(p => {
            const pSub = (p.subCategory || "").toLowerCase().replace(/\s+/g, "");
            return pSub === targetSub || (p.subCategory || "").toLowerCase() === activeSubCategory.toLowerCase();
         });
      }
    }

    // Filter by Discount Percentage if requested in URL (e.g. ?discount=30)
    if (discountParam) {
      const targetDiscount = parseInt(discountParam);
      if (!isNaN(targetDiscount)) {
        const matchingDiscountItems = filtered.filter(p => {
          if (!p.price || !p.discountPrice) return false;
          const rP = parseInt(p.price.replace(/[^\d]/g, "") || "0");
          const rD = parseInt(p.discountPrice.replace(/[^\d]/g, "") || "0");
          if (rP > 0 && rD > 0) {
             const actualDiscount = Math.round(((rP - rD) / rP) * 100);
             // Return true if it matches exactly or is HIGHER than the target discount (e.g. 33% on a 30% banner)
             return actualDiscount >= targetDiscount;
          }
          return false;
        });

        // Only apply the discount filter if it actually returns some products.
        if (matchingDiscountItems.length > 0) {
          filtered = matchingDiscountItems;
        }
      }
    }

    // Filter by gender
    if (activeGender !== "ALL") {
      filtered = filtered.filter((p) => (p.gender || "").toUpperCase() === activeGender);
    }

    // Sort products
    switch (activeSort) {
      case "Price: Low to High":
        filtered.sort((a, b) => a.numericPrice - b.numericPrice);
        break;
      case "Price: High to Low":
        filtered.sort((a, b) => b.numericPrice - a.numericPrice);
        break;
      case "Newest":
        filtered.sort((a, b) => (a.isNew === b.isNew ? 0 : a.isNew ? -1 : 1));
        break;
      case "Best selling":
      default:
        filtered.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
        break;
    }

    return filtered;
  }, [allProducts, activeGender, activeSort, activeCategory, activeSubCategory, query, discountParam]);

  const activeCategorySubs = useMemo(() => {
    if (activeCategory === "all") return [];
    // Normalize by stripping spaces and lowercasing both sides for comparison
    const normalizedActive = activeCategory.toLowerCase().replace(/\s+/g, "");
    const match = Object.entries(globalSubCategories).find(
      ([cat]) => cat.toLowerCase().replace(/\s+/g, "") === normalizedActive
    );
    return match ? match[1] : [];
  }, [activeCategory, globalSubCategories]);

  if (productsLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <div className="flex flex-col items-center gap-6">
          <div className="w-16 h-16 border-4 border-[#B0843D]/20 border-t-[#310101] rounded-full animate-spin" />
          <p className="text-[15px] font-black uppercase tracking-[0.4em] text-[#310101]/90 animate-pulse">Curation of Elegance...</p>
        </div>
      </div>
    );
  }

  let displayTitle = title;
  let displaySubtitle = subtitle;

  if (discountParam) {
    displayTitle = `${discountParam}% OFF Special Collection`;
    displaySubtitle = `Handpicked selections from across our catalog — all reaching up to ${discountParam}% or more in savings.`;
  } else if (title === "Kaleemiya Signature" && activeCategory && activeCategory !== "all") {
    // Default — capitalize
    displayTitle = activeCategory.charAt(0).toUpperCase() + activeCategory.slice(1);
    displaySubtitle = `Explore our curated selection of ${displayTitle}.`;

    const cat = activeCategory.toLowerCase().replace(/\s+/g, "");

    if (cat === "perfumes") {
      displayTitle = "Luxury Perfumes";
      displaySubtitle = "Discover our exquisite range of Men's, Women's, and Unisex fragrances — from French to Arabic concentrations.";
    } else if (cat === "attar") {
      displayTitle = "Exquisite Attars";
      displaySubtitle = "Discover our premium selection of concentrated pure oils and artisanal attars, crafted with traditional Middle Eastern heritage.";
    } else if (cat === "oud") {
      displayTitle = "Majestic Oud";
      displaySubtitle = "Experience the rich, woody, and luxurious essence of pure Oud — Cambodi, Assami, Indian and Malaysian.";
    } else if (cat === "bakhoor") {
      displayTitle = "Premium Bakhoor";
      displaySubtitle = "Fill your home with the enchanting and traditional aroma of Arabian Bakhoor — incense sticks, tablets, and loose wood.";
    } else if (cat === "giftsets" || cat === "gift sets") {
      displayTitle = "Curated Gift Sets";
      displaySubtitle = "Perfectly packaged luxury gift sets — from Bukhur Dans and Quran Books to Tasbeeh and premium Luxury Boxes.";
    } else if (cat === "tasbhi" || cat === "tasbeeh") {
      displayTitle = "Tasbhi & Prayer Beads";
      displaySubtitle = "Handcrafted Tasbeeh in Crystal, Wooden, Digital, and Stone — a meaningful gift for every occasion.";
    } else if (cat === "prayermats" || cat === "prayer mats") {
      displayTitle = "Premium Prayer Mats";
      displaySubtitle = "Exquisitely crafted Janimaaz and prayer mats — Velvet, Children's, and Travel sizes available.";
    } else if (cat === "books") {
      displayTitle = "Islamic Literature";
      displaySubtitle = "A curated collection of Quran, Hadith, and essential Islamic literature — in English, Urdu, Roman, and more.";
    } else if (cat === "ourbestseller") {
      displayTitle = "Our Bestsellers";
      displaySubtitle = "The most loved fragrances and products at Kaleemiya — handpicked by our customers.";
    } else if (cat === "newarrival") {
      displayTitle = "New Arrivals";
      displaySubtitle = "Fresh additions to our Signature — be the first to discover the newest scents and collections.";
    }
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] text-[#310101] overflow-x-hidden flex flex-col">
      <Header />
      <div className="h-24 md:h-32"></div>

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 mb-32">
        {/* Page Header */}
        <div className="relative pt-6 pb-12 md:pb-16">
          <button 
            onClick={() => navigate(-1)}
            className="group flex items-center gap-2.5 mb-8 text-[#310101]/40 hover:text-[#310101] transition-all"
          >
            <div className="w-8 h-8 rounded-full border border-black/5 flex items-center justify-center group-hover:bg-[#310101] group-hover:text-white transition-all shadow-sm">
              <ArrowLeft className="w-4 h-4" />
            </div>
            <span className="text-[12px] font-black uppercase tracking-[0.2em]">Go Back</span>
          </button>

          <div className="flex flex-col items-center text-center space-y-4">
            <motion.h1 
              key={displayTitle}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-4xl sm:text-5xl md:text-7xl font-serif text-[#310101] leading-tight"
            >
              {displayTitle}
            </motion.h1>
            <p className="text-[#310101] font-sans text-xs md:text-base max-w-2xl px-4 opacity-70">
              {displaySubtitle}
            </p>
          </div>
        </div>

        {/* Subcategory and Category Filters Ribbon */}
        {/* Unified Filter & Navigation Ribbon */}
        {!discountParam && (
          <div className="flex flex-col xl:flex-row xl:items-center gap-4 xl:gap-6 py-6 md:py-10 border-y border-[#310101]/5 mt-6 md:mt-12 bg-transparent xl:bg-white/40 px-0 xl:px-8 rounded-none xl:rounded-[40px] shadow-none xl:shadow-sm">
           
           {/* Mobile Top Row: Reset + Sort */}
           <div className="flex xl:hidden items-center justify-between px-4 sm:px-6 w-full shrink-0 gap-3">
              <button 
                onClick={() => {
                  setActiveCategory("all");
                  setActiveSubCategory("all");
                  setActiveGender("ALL");
                  navigate("/shop", { replace: true });
                }}
                className={`flex-1 text-[11px] sm:text-[13px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] transition-all px-4 sm:px-8 py-3 rounded-full border-2 whitespace-nowrap flex items-center justify-center ${
                  activeCategory === "all" ? "bg-[#310101] border-[#310101] text-white shadow-md" : "bg-white border-[#310101]/10 text-[#310101]/80 shadow-sm"
                }`}
              >
                All Products
              </button>

              <div className="relative shrink-0 z-40">
                 <button 
                   onClick={() => setIsSortOpen(!isSortOpen)}
                   className="flex items-center justify-center gap-2 border border-[#310101]/10 px-4 sm:px-8 py-3 rounded-full text-[11px] sm:text-[13px] font-black uppercase tracking-[0.1em] sm:tracking-[0.2em] text-[#310101] bg-white shadow-sm whitespace-nowrap"
                 >
                    {activeSort}
                    <ChevronDown className={`w-3 h-3 transition-transform duration-500 ${isSortOpen ? 'rotate-180' : ''}`} />
                 </button>
                 <AnimatePresence>
                   {isSortOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-[calc(100%+8px)] w-56 bg-white border border-[#310101]/10 rounded-2xl shadow-xl z-50 overflow-hidden py-2"
                      >
                         {sortOptionsArr.map(opt => (
                            <button 
                              key={opt}
                              onClick={() => { setActiveSort(opt); setIsSortOpen(false); }}
                              className={`w-full text-left px-5 py-3 text-[11px] sm:text-[12px] font-black uppercase tracking-widest transition-all ${
                                activeSort === opt ? "text-[#B0843D] bg-[#F9F6F2]" : "text-[#310101]/70 hover:text-[#310101] hover:bg-black/5"
                              }`}
                            >
                               {opt}
                            </button>
                         ))}
                      </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </div>

           {/* Desktop Left side: Reset */}
           <div className="hidden xl:flex shrink-0">
              <button 
                onClick={() => {
                  setActiveCategory("all");
                  setActiveSubCategory("all");
                  setActiveGender("ALL");
                  navigate("/shop", { replace: true });
                }}
                className={`text-[13px] font-black uppercase tracking-[0.2em] transition-all px-8 py-3.5 rounded-full border-2 whitespace-nowrap ${
                  activeCategory === "all" ? "bg-[#310101] border-[#310101] text-white shadow-xl" : "bg-transparent border-[#310101]/10 text-[#310101]/80 hover:border-[#310101]/30"
                }`}
              >
                Entire Catalog
              </button>
           </div>

           {/* Center: Scrollable Categories/Subcategories Pills */}
           <div className="flex-1 w-full overflow-x-auto scrollbar-hide py-2 xl:py-0">
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-2 sm:gap-3 px-4 sm:px-6 xl:px-4 min-w-max"
              >
                {activeCategory === "all" ? (
                  // Main Category Navigation
                  globalCategories.map(cat => (
                    <button 
                      key={cat}
                      onClick={() => {
                          const params = new URLSearchParams();
                          params.set("category", cat.toLowerCase());
                          navigate(`/shop?${params.toString()}`);
                      }}
                      className="px-5 sm:px-6 py-2.5 rounded-full text-[11px] sm:text-[12px] font-black uppercase tracking-widest transition-all bg-[#F9F6F2] border border-[#310101]/10 text-[#310101]/80 hover:bg-[#310101] hover:text-[#E5D5C5] whitespace-nowrap"
                    >
                      {cat}
                    </button>
                  ))
                ) : (
                  // Deep Category Refining
                  <>
                    {extraCategories.map(cat => (
                      <button 
                        key={cat}
                        onClick={() => {
                            setActiveCategory(cat.toLowerCase());
                            setActiveSubCategory("all");
                        }}
                        className={`px-5 sm:px-6 py-2.5 rounded-full text-[11px] sm:text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                          activeCategory === cat.toLowerCase() ? "bg-[#B0843D] text-[#E5D5C5] shadow-lg" : "bg-[#F9F6F2] border border-[#310101]/10 text-[#310101]/80 hover:bg-[#310101] hover:text-[#E5D5C5]"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                    {activeCategorySubs.length > 0 && (
                      <>
                        <div className="w-[1px] h-6 bg-[#310101]/10 mx-1 sm:mx-2 shrink-0"></div>
                        {activeCategorySubs
                          .filter(sub => !extraCategories.map(c => c.toLowerCase()).includes(sub.toLowerCase()))
                          .map(sub => (
                          <button 
                            key={sub}
                            onClick={() => {
                              const s = sub.toLowerCase();
                              if (["men", "women", "unisex"].includes(s)) {
                                setActiveGender(s.toUpperCase() as any);
                                setActiveSubCategory("all");
                              } else {
                                setActiveSubCategory(s);
                              }
                            }}
                            className={`px-5 sm:px-6 py-2.5 rounded-full text-[11px] sm:text-[12px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                              (activeSubCategory === sub.toLowerCase() || (activeGender.toLowerCase() === sub.toLowerCase() && activeSubCategory === "all")) ? "bg-[#B0843D] text-[#E5D5C5] shadow-lg" : "bg-[#F9F6F2] border border-[#310101]/10 text-[#310101]/80 hover:bg-[#310101] hover:text-[#E5D5C5]"
                            }`}
                          >
                            {sub}
                          </button>
                        ))}
                      </>
                    )}
                  </>
                )}
              </motion.div>
           </div>

           {/* Desktop Right: Sorting & Meta */}
           <div className="hidden xl:flex items-center gap-6 shrink-0">
              <span className="text-[12px] font-black uppercase tracking-widest text-[#310101]/40">
                 {filteredAndSortedProducts.length} Results
              </span>
              <div className="relative group/sort">
                 <button 
                   onClick={() => setIsSortOpen(!isSortOpen)}
                   className="flex items-center gap-3 border border-[#310101]/10 px-8 py-3.5 rounded-full text-[13px] font-black uppercase tracking-widest text-[#310101] hover:border-[#310101]/30 transition-all bg-white whitespace-nowrap"
                 >
                    {activeSort}
                    <ChevronDown className={`w-3 h-3 transition-transform duration-500 ${isSortOpen ? 'rotate-180' : ''}`} />
                 </button>
                 <AnimatePresence>
                   {isSortOpen && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute right-0 top-full mt-2 w-56 bg-white border border-[#310101]/10 rounded-2xl shadow-2xl z-50 overflow-hidden py-2"
                      >
                         {sortOptionsArr.map(opt => (
                            <button 
                              key={opt}
                              onClick={() => { setActiveSort(opt); setIsSortOpen(false); }}
                              className={`w-full text-left px-7 py-2.5 text-[12px] font-black uppercase tracking-widest transition-all ${
                                activeSort === opt ? "text-[#B0843D] bg-gray-50" : "text-[#310101] hover:text-[#310101] hover:bg-gray-100"
                              }`}
                            >
                               {opt}
                            </button>
                         ))}
                      </motion.div>
                   )}
                 </AnimatePresence>
              </div>
           </div>
        </div>

        )}

        {/* Status Area */}
        {(activeCategory !== "all" || activeSubCategory !== "all" || activeGender !== "ALL") && !discountParam && (
          <div className="py-10 flex flex-wrap items-center gap-4">
             <div className="flex items-center gap-2 text-[#310101]/70 font-black uppercase tracking-[0.2em] text-[14px]">Active Exploration:</div>
             <div className="flex flex-wrap gap-4">
                {activeCategory !== "all" && (
                   <span className="bg-[#310101] text-white px-5 py-2 rounded-full text-[14px] font-black uppercase tracking-[0.15em] flex items-center gap-3">
                      {activeCategory}
                      <button onClick={() => { setActiveCategory("all"); setActiveSubCategory("all"); }} className="hover:scale-125 transition-transform opacity-60">×</button>
                   </span>
                )}
                {activeSubCategory !== "all" && (
                   <span className="bg-[#B0843D] text-white px-5 py-2 rounded-full text-[14px] font-black uppercase tracking-[0.15em] flex items-center gap-3">
                      {activeSubCategory}
                      <button onClick={() => setActiveSubCategory("all")} className="hover:scale-125 transition-transform opacity-60">×</button>
                   </span>
                )}
                {activeGender !== "ALL" && (
                   <span className="bg-[#F9F6F2] border border-[#310101]/10 text-[#310101] px-5 py-2 rounded-full text-[14px] font-black uppercase tracking-[0.15em] flex items-center gap-3">
                      {activeGender}
                      <button onClick={() => setActiveGender("ALL")} className="hover:scale-125 transition-transform opacity-40">×</button>
                   </span>
                )}
             </div>
          </div>
        )}

        {/* Product Grid Area */}
        <div className="pt-8">
           {filteredAndSortedProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-12 lg:gap-x-10 lg:gap-y-20">
                 {filteredAndSortedProducts.map((product) => (
                    <div key={product.id} className="w-full">
                       <ProductCard {...product} />
                    </div>
                 ))}
              </div>
           ) : (
              <div className="py-40 text-center bg-[#F9F6F2] rounded-[60px] border-2 border-dashed border-[#310101]/5 flex flex-col items-center justify-center">
                 <div className="w-24 h-24 bg-white/50 rounded-full flex items-center justify-center mb-8">
                   <SlidersHorizontal className="w-10 h-10 text-[#310101]/60" />
                 </div>
                 <h2 className="text-3xl font-serif text-[#310101] mb-2">No matching artisan items</h2>
                 <p className="text-[#310101]/90 font-sans text-sm italic">Extend your search criteria to explore more of Kaleemiya's heritage.</p>
                 <button 
                   onClick={() => {
                     setActiveCategory("all");
                     setActiveGender("ALL");
                     setActiveSubCategory("all");
                     navigate("/shop", { replace: true });
                   }}
                   className="mt-12 bg-[#310101] text-[#E5D5C5] px-12 py-5 rounded-full text-[14px] font-black uppercase tracking-[0.3em] shadow-2xl hover:scale-105 active:scale-95 transition-all"
                 >
                   Reset My Exploration
                 </button>
              </div>
           )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Shop;
