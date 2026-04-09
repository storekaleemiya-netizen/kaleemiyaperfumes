import React from "react";
import { useCart } from "@/context/CartContext";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetClose
} from "@/components/ui/sheet";
import { ShoppingCart, ShoppingBag, Minus, Plus, X, ArrowRight, Truck, ShieldCheck, Droplets, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProducts } from "@/hooks/useProducts";
import { useNavigate } from "react-router-dom";

import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/context/UIContext.tsx";
import { toast } from "sonner";

const CartDrawer = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { openLogin } = useUI();
  const { cart, removeFromCart, updateQuantity, totalCount, clearCart, addToCart } = useCart();
  const { products } = useProducts();
  const [isSuccess, setIsSuccess] = React.useState(false);

  const recommendations = React.useMemo(() => {
    return products
      .filter(p => p.isLive !== false && !cart.find(c => c.id === p.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, 6);
  }, [products, cart]);

  const scrollOffer = (dir: 'left' | 'right') => {
    const container = document.getElementById('offer-scroll-container');
    if (container) {
      const amount = dir === 'left' ? -320 : 320;
      container.scrollTo({
        left: container.scrollLeft + amount,
        behavior: 'smooth'
      });
    }
  };

  const handleCheckout = () => {
    if (!user) {
      toast.info("Please sign-in to complete your Signature order.");
      openLogin();
      return;
    }
    navigate('/checkout');
  };

  const totalPrice = cart.reduce((sum, item) => {
    const price = parseInt(item.price.replace(/[^\d]/g, ""));
    return sum + (price * item.quantity);
  }, 0);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <button className="relative p-2 text-white hover:bg-white/10 rounded-full transition-all flex items-center group">
          <ShoppingBag className="w-[22px] h-[22px] group-hover:scale-110 transition-transform" strokeWidth={1.5} />
          {totalCount > 0 && (
            <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#310101] text-[11px] flex items-center justify-center text-white font-black border-2 border-white shadow-md group-hover:scale-110 transition-transform">
              {totalCount}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[440px] flex flex-col p-0 border-l-0 bg-[#FDFCFB] text-[#310101] shadow-2xl z-[10000]">
        {/* Elite Header */}
        <SheetHeader className="px-8 py-6 border-b border-[#310101]/5 bg-white/80 backdrop-blur-md sticky top-0 z-50">
          <div className="flex flex-col items-center">
            <SheetTitle className="font-serif text-[26px] italic font-black text-[#310101] tracking-tight">
               My Signature Bag
            </SheetTitle>
            <div className="flex items-center gap-3 mt-1.5">
               <div className="h-px w-6 bg-[#B0843D]/30" />
               <p className="text-[10px] uppercase tracking-[0.4em] font-black text-[#B0843D]">
                 {totalCount} {totalCount === 1 ? 'Selection' : 'Selections'}
               </p>
               <div className="h-px w-6 bg-[#B0843D]/30" />
            </div>
          </div>
        </SheetHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {cart.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-10">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-[#F9F6F2] flex items-center justify-center shadow-inner">
                  <ShoppingBag className="w-10 h-10 text-[#B0843D]/20" strokeWidth={1} />
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
                   <Droplets className="w-4 h-4 text-[#B0843D] animate-pulse" />
                </div>
              </div>
              <div className="space-y-4">
                <h3 className="font-serif text-3xl italic font-black text-[#310101]">Your bag is quiet</h3>
                <p className="text-[15px] font-sans font-medium text-[#310101]/40 max-w-[240px] mx-auto leading-relaxed">
                  Our master perfumers are waiting to fill your world with exquisite essence.
                </p>
              </div>
              <SheetClose asChild>
                <Button 
                  className="rounded-full bg-[#310101] text-white px-10 py-7 font-black uppercase tracking-[0.2em] text-[12px] hover:scale-105 active:scale-95 transition-all shadow-xl"
                >
                  Explore Collection
                </Button>
              </SheetClose>
            </div>
          ) : isSuccess ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 animate-in fade-in zoom-in duration-700">
               <div className="w-28 h-28 rounded-full bg-[#B0843D]/10 flex items-center justify-center border-4 border-[#B0843D]/20 scale-110">
                  <ShieldCheck className="w-14 h-14 text-[#B0843D]" strokeWidth={1} />
               </div>
               <div className="space-y-4">
                  <h3 className="font-serif text-4xl italic font-black text-[#310101]">Journey Confirmed</h3>
                  <p className="text-sm font-sans font-medium text-[#310101]/50 max-w-[260px] mx-auto leading-relaxed">
                     Your artisan selections are being prepared for their premium fragrance voyage.
                  </p>
               </div>
               <SheetClose asChild>
                 <Button 
                   onClick={() => setIsSuccess(false)}
                   className="w-full bg-[#310101] text-white rounded-[20px] h-16 font-black uppercase tracking-[0.4em] text-[13px] shadow-2xl hover:bg-black transition-all"
                 >
                   CONTINUE EXPLORING
                 </Button>
               </SheetClose>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8 space-y-10">
                {/* Exclusive Benefit Strip */}
                <div className="bg-[#310101] p-5 rounded-[24px] flex items-center justify-between shadow-lg relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                   <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#B0843D] flex items-center justify-center">
                        <Tag className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-black text-white uppercase tracking-wider">Online Signature</span>
                        <span className="text-[10px] font-bold text-[#DEB87A] opacity-80 uppercase tracking-widest">Complimentary Privilege</span>
                      </div>
                   </div>
                   <div className="text-right">
                      <span className="text-[16px] font-black text-white">SAVE {"\u20B9"}300</span>
                      <p className="text-[8px] font-bold text-[#DEB87A] uppercase tracking-widest leading-none mt-1">Limited Period</p>
                   </div>
                </div>

                {/* Cart Items */}
                <div className="space-y-8">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-6 group relative">
                      <div className="w-24 h-32 bg-white rounded-[24px] overflow-hidden shrink-0 border border-gray-100 shadow-sm relative p-3 flex items-center justify-center">
                        <img 
                          src={item.image} 
                          alt={item.name} 
                          className="w-full h-full object-contain mix-blend-multiply group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors" />
                      </div>
                      <div className="flex-1 flex flex-col py-2">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-serif text-[22px] italic font-black text-[#310101] leading-tight pr-4">
                            {item.name}
                          </h4>
                          <button 
                            onClick={() => removeFromCart(item.id)}
                            className="bg-gray-50 hover:bg-red-50 text-gray-300 hover:text-red-500 w-8 h-8 rounded-full flex items-center justify-center transition-all hover:rotate-90"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        
                        <div className="flex flex-col mb-4">
                           <span className="text-[11px] font-black text-[#B0843D] uppercase tracking-[0.2em] mb-1">Pure Concentration</span>
                           <p className="text-[22px] font-sans font-black text-[#310101]">{"\u20B9"}{parseInt(item.price.replace(/[^\d]/g, "")).toLocaleString()}</p>
                        </div>
                        
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex items-center bg-white rounded-full px-4 py-2 border-2 border-gray-100 shadow-sm">
                            <button 
                              onClick={() => updateQuantity(item.id, -1)}
                              className="p-1.5 text-black hover:text-[#B0843D] transition-colors"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className="px-5 text-[15px] font-black w-14 text-center text-[#310101]">{item.quantity}</span>
                            <button 
                              onClick={() => updateQuantity(item.id, 1)}
                              className="p-1.5 text-black hover:text-[#B0843D] transition-colors"
                            >
                              <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Refined Recommendations - Professional Signature Style */}
                {recommendations.length > 0 && (
                  <div className="pt-10 space-y-6">
                    <div className="flex items-center justify-between px-1">
                       <h4 className="font-serif text-[22px] italic font-black text-[#310101]">You May Also Like</h4>
                       <div className="flex gap-2">
                          <button onClick={() => scrollOffer('left')} className="w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center hover:bg-white hover:shadow-md transition-all text-gray-400 hover:text-black">
                             <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button onClick={() => scrollOffer('right')} className="w-9 h-9 rounded-full border border-gray-100 flex items-center justify-center hover:bg-white hover:shadow-md transition-all text-gray-400 hover:text-black">
                             <ChevronRight className="w-5 h-5" />
                          </button>
                       </div>
                    </div>
                    
                    <div 
                      id="offer-scroll-container"
                      className="flex gap-5 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory scroll-smooth -mx-1 px-1"
                    >
                      {recommendations.map((item) => (
                        <div 
                          key={item.id} 
                          className="snap-center shrink-0 w-[280px] bg-white rounded-[32px] p-5 flex flex-col shadow-[0_5px_25px_rgba(0,0,0,0.03)] border border-gray-50 group/card"
                        >
                          <div className="flex gap-5 cursor-pointer mb-5" onClick={() => navigate(`/product/${item.id}`)}>
                             <div className="w-24 h-28 bg-[#FDFBF7] rounded-[20px] overflow-hidden shrink-0 border border-black/5 p-2 flex items-center justify-center">
                               <img src={item.image} alt={item.name} className="w-full h-full object-contain group-hover/card:scale-105 transition-transform" />
                             </div>
                             <div className="flex flex-col justify-center min-w-0">
                                <h5 className="text-[15px] font-sans font-black text-black line-clamp-2 leading-tight mb-2 tracking-tight">{item.name}</h5>
                                <div className="space-y-0.5">
                                  <span className="text-[11px] text-gray-300 line-through font-bold">{"\u20B9"}{(parseInt(item.price.replace(/[^\d]/g, "")) * 1.5).toLocaleString()}</span>
                                  <p className="text-[18px] font-black text-[#310101]">{"\u20B9"}{parseInt(item.price.replace(/[^\d]/g, "")).toLocaleString()}</p>
                                </div>
                             </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                             <div className="bg-[#1ABC9C]/10 text-[#1ABC9C] text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest whitespace-nowrap">
                               33% SAVINGS
                             </div>
                             <button 
                               onClick={(e) => {
                                 e.stopPropagation();
                                 if (!user) {
                                   toast.info("Please sign-in to continue your artisan journey.");
                                   openLogin();
                                   return;
                                 }
                                 addToCart({ id: item.id, name: item.name, price: item.price, image: item.image });
                               }}
                               className="flex-1 h-11 bg-[#F9F6F2] text-[#B0843D] rounded-full text-[12px] font-black uppercase tracking-widest hover:bg-[#B0843D] hover:text-white transition-all flex items-center justify-center border border-[#B0843D]/10"
                             >
                               + Add Selection
                             </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Professional Signature Footer - Glassmorphism & High Contrast */}
        {cart.length > 0 && !isSuccess && (
          <div className="p-8 pb-10 bg-white border-t border-gray-100 shadow-[0_-20px_40px_rgba(0,0,0,0.02)] space-y-8 mt-auto z-50">
            <div className="space-y-4">
               <div className="flex justify-between items-center text-[12px] font-black uppercase tracking-[0.2em] text-black/30">
                  <span>Subtotal Amount</span>
                  <span className="text-black">{"\u20B9"}{totalPrice.toLocaleString()}</span>
               </div>
               
               <div className="flex items-end justify-between gap-6 pt-2">
                  <div className="flex flex-col">
                     <span className="text-[11px] font-black text-[#B0843D] uppercase tracking-[0.3em] mb-2 px-1">Total Payable</span>
                     <span className="text-[34px] font-sans font-black text-[#310101] leading-none tracking-tighter">{"\u20B9"}{totalPrice.toLocaleString()}</span>
                  </div>
                  <Button 
                    onClick={handleCheckout}
                    className="flex-1 h-[72px] bg-[#310101] text-white rounded-[24px] font-black uppercase tracking-[0.3em] text-[14px] shadow-[0_20px_50px_rgba(49,1,1,0.2)] hover:bg-black group transition-all"
                  >
                    <span className="text-[#DEB87A] flex items-center gap-3">
                      CHECKOUT NOW 
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                    </span>
                  </Button>
               </div>
            </div>

            {/* Seamless Trust Badges */}
            <div className="flex items-center justify-between px-2 pt-2">
               <div className="flex items-center gap-3 opacity-60">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <Truck className="w-5 h-5 text-black" strokeWidth={1} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-black uppercase tracking-widest">Global</span>
                    <span className="text-[8px] font-bold text-black/40 uppercase tracking-widest">Shipping</span>
                  </div>
               </div>
               <div className="flex items-center gap-3 opacity-60">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5 text-black" strokeWidth={1} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-black uppercase tracking-widest">Secure</span>
                    <span className="text-[8px] font-bold text-black/40 uppercase tracking-widest">SSL Order</span>
                  </div>
               </div>
               <div className="flex items-center gap-3 opacity-60">
                  <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center">
                    <Droplets className="w-5 h-5 text-black" strokeWidth={1} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-black uppercase tracking-widest">Pure</span>
                    <span className="text-[8px] font-bold text-black/40 uppercase tracking-widest">Authentic</span>
                  </div>
               </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default CartDrawer;
