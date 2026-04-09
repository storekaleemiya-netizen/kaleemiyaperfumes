import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { Star, ShoppingCart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext.tsx";
import { toast } from "sonner";

interface ProductCardProps {
  id: string;
  image: string;
  name: string;
  price: string;
  isNew?: boolean;
  category?: string;
  subCategory?: string;
  discountPrice?: string;
  video?: string;
}

const ProductCard = ({ id, image, name, price, isNew, category, subCategory, discountPrice, video }: ProductCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLogin } = useUI();
  const { addToCart } = useCart();

  // Simple Manual Discount Logic
  let activeDiscountPrice = discountPrice;
  let activeDiscountPercent = 0;

  if (discountPrice) {
    const rawPrice = parseInt(price?.replace(/[^\d]/g, "") || "0");
    const rawDiscount = parseInt(discountPrice?.replace(/[^\d]/g, "") || "0");
    if (rawPrice > 0 && rawDiscount > 0) {
      activeDiscountPercent = Math.round(((rawPrice - rawDiscount) / rawPrice) * 100);
    }
  }

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      toast.info("Please sign-in to continue your artisan journey.");
      openLogin();
      return;
    }
    // Use the correctly discounted price for the cart
    const finalCartPrice = activeDiscountPrice 
      ? (activeDiscountPrice.startsWith('\u20B9') ? activeDiscountPrice : `\u20B9${parseInt(activeDiscountPrice).toLocaleString()}`) 
      : price;
    addToCart({ id, image, name, price: finalCartPrice });
  };

  return (
    <motion.div
      className="group w-full h-full cursor-pointer bg-[#FDFCFB] border border-black/5 hover:border-[#B0843D]/30 transition-all duration-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl flex flex-col relative"
      onClick={() => navigate(`/product/${id}`)}
    >
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-white rounded-t-xl group/media">
        <img
          src={image}
          alt={name}
          className={`w-full h-full object-cover object-center transition-all duration-700 ${video ? 'group-hover/media:opacity-0' : 'group-hover:scale-105'}`}
          loading="lazy"
        />
        {video && (
          <video 
            src={video} 
            className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover/media:opacity-100 transition-opacity duration-500"
            muted loop playsInline onMouseEnter={(e) => e.currentTarget.play()} onMouseLeave={(e) => e.currentTarget.pause()}
          />
        )}
        {isNew && (
          <span className="absolute top-2 left-2 md:top-4 md:left-4 z-10 bg-[#310101] text-white text-[9px] md:text-[11px] font-black tracking-[0.2em] uppercase px-3 py-1.5 rounded-sm shadow-xl">
            NEW ARRIVAL
          </span>
        )}
      </div>

      <div className="px-4 pb-5 md:px-6 md:pb-7 flex flex-col flex-1 text-left bg-[#FDFCFB] relative">
        
        {/* Rating Right Below Image aligned to Right */}
        <div className="flex justify-end mb-1 mt-1.5 md:mt-2">
          {/* Rating placeholder removed for a cleaner look */}
        </div>

        {/* Product Title */}
        <h3 className="font-serif text-[16px] sm:text-[18px] md:text-[22px] font-bold text-[#310101] mb-1 md:mb-2 leading-snug line-clamp-2">
          {name}
        </h3>

        {/* Price Row */}
        <div className="flex flex-wrap items-center gap-1.5 md:gap-2 mb-3 md:mb-4 mt-auto">
          {activeDiscountPrice ? (
            <>
               <span className="text-[18px] sm:text-[20px] md:text-[24px] font-sans font-black text-black leading-none tracking-tight">
                 {"\u20B9"}{parseInt(activeDiscountPrice.replace(/[^\d]/g, "")).toLocaleString()}
               </span>
               <span className="text-[#747e8e] line-through text-[13px] md:text-[15px] font-sans font-bold">
                 {"\u20B9"}{parseInt(price.replace(/[^\d]/g, "")).toLocaleString()}
               </span>
               {activeDiscountPercent > 0 && (
                 <span className="bg-[#489b6f] text-white text-[10px] md:text-[13px] font-sans font-black px-1.5 py-[2px] rounded tracking-wide">
                   {activeDiscountPercent}% off
                 </span>
               )}
            </>
          ) : (
             <span className="text-[18px] sm:text-[20px] md:text-[24px] font-sans font-black text-black leading-none tracking-tight">
               {"\u20B9"}{parseInt(price.replace(/[^\d]/g, "")).toLocaleString()}
             </span>
          )}
        </div>

        {/* ADD TO CART Button */}
        <button 
          onClick={handleAddToCart}
          className="w-full py-2.5 md:py-3 bg-[#DEB87A] hover:bg-[#D0A96B] text-black font-sans font-black uppercase tracking-[0.1em] text-[11px] sm:text-[12px] md:text-[14px] rounded-full transition-all flex items-center justify-center gap-2 mt-2"
        >
          <span className="whitespace-nowrap">ADD TO CART</span>
          <ShoppingCart className="w-4 h-4 text-black fill-black shrink-0" />
        </button>
      </div>
    </motion.div>
  );
};

export default ProductCard;
