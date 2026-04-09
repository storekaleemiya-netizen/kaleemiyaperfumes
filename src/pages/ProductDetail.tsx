import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Star, ShieldCheck, Truck, RotateCcw, ShoppingCart, Trash2, ArrowLeft } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProductImageSlider from "@/components/ProductImageSlider";
import { useProducts } from "@/hooks/useProducts";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  deleteDoc,
  doc
} from "firebase/firestore";
import productExtra1 from "@/assets/product-extra-1.png";
import productExtra2 from "@/assets/product-extra-2.png";
import productExtra3 from "@/assets/product-extra-3.png";
import productExtra4 from "@/assets/product-extra-4.png";
import { toast } from "sonner";
import { useUI } from "@/context/UIContext.tsx";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const { openLogin } = useUI();
  const { addToCart } = useCart();
  const { products, loading } = useProducts();
  const product = products.find((p) => p.id === id);

  // Review States
  const [reviews, setReviews] = useState<any[]>([]);
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Scroll to top when this page loads or when navigating to another product perfectly
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [id]);

  // Real-time Reviews Listener
  useEffect(() => {
    if (!id) return;
    const q = query(
      collection(db, "reviews"),
      where("productId", "==", id)
    );
    const unsub = onSnapshot(q, (snap) => {
      // Sort on client-side to avoid needing a Firestore composite index
      const fetchedReviews = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      fetchedReviews.sort((a: any, b: any) => {
        const dateA = a.createdAt?.toDate() || new Date(0);
        const dateB = b.createdAt?.toDate() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setReviews(fetchedReviews);
    });
    return () => unsub();
  }, [id]);

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length).toFixed(1)
    : "5.0";

  if (loading) {
     return <div className="min-h-screen flex items-center justify-center font-serif italic text-2xl">Awaiting the Essence...</div>;
  }

  if (!product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <h2 className="text-2xl font-serif mb-4 text-[#310101]">Signature Item Not Found</h2>
        <Button onClick={() => navigate("/shop")} className="bg-[#310101] text-white px-8 py-6 rounded-xl uppercase font-black tracking-widest text-[15px]">Return to Collection</Button>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (!user) {
      toast.info("Please sign-in to continue your artisan journey.");
      openLogin();
      return;
    }
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image
    });
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm("Are you sure you want to remove this reflection?")) return;
    try {
      await deleteDoc(doc(db, "reviews", reviewId));
      toast.success("Reflection removed from collection.");
    } catch (error) {
      toast.error("Failed to remove reflection.");
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error("Please sign in to leave a reflection.");
      return;
    }
    if (!newReview.comment.trim()) {
      toast.error("Please share your thoughts with us.");
      return;
    }

    setIsSubmitting(true);
    try {
      const reviewData = {
        productId: id,
        userName: user.displayName || user.email?.split('@')[0] || "Exquisite Guest",
        userEmail: user.email,
        userId: user.uid,
        rating: newReview.rating,
        comment: newReview.comment.trim(),
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, "reviews"), reviewData);
      
      setNewReview({ rating: 5, comment: "" });
      toast.success("Thank you for your reflection. It has been shared with the community.");
    } catch (err: any) {
      console.error("Review Error:", err);
      toast.error("Failed to submit review. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <div className="h-24 md:h-32"></div>

      <main className="flex-grow w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 mb-20 relative">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground uppercase tracking-widest mb-8 overflow-x-auto whitespace-nowrap pb-2 pl-12 sm:pl-14">
          <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate("/")}>Home</span>
          <ChevronRight className="w-3 h-3" />
          <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate("/shop")}>Shop</span>
          <ChevronRight className="w-3 h-3" />
          <span className="hover:text-primary cursor-pointer transition-colors" onClick={() => navigate(`/${product.category.replace(" ", "-")}`)}>{product.category}</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          {/* Product Image Slider */}
          <div className="lg:col-span-7 relative">
            <ProductImageSlider 
              images={[
                product.image,
                ...(product.extraImages || [])
              ].filter(Boolean)} 
              video={product.video}
            />
            {product.isNew && (
              <span className="absolute top-6 left-6 gold-gradient-bg text-primary-foreground text-[14px] font-sans font-semibold tracking-[0.2em] uppercase px-4 py-1.5 rounded-sm z-20">
                New Arrival
              </span>
            )}
          </div>

          {/* Product Info */}
          <div className="lg:col-span-12 lg:col-start-1 xl:col-span-5 space-y-8">
            <header className="space-y-4">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[14px] text-[#B0843D] font-sans font-black tracking-[0.3em] uppercase px-4 py-1 border-2 border-[#B0843D]/20 rounded-full">
                  {product.category} {product.subCategory && ` — ${product.subCategory}`}
                </span>
                <span className="text-[14px] text-black/40 font-sans font-black tracking-[0.2em] uppercase px-4 py-1 bg-gray-50 rounded-full italic">
                  {product.gender}
                </span>
                <div className="flex items-center text-amber-500 gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className={`w-3 h-3 ${i < Math.floor(parseFloat(averageRating)) ? "fill-current" : ""}`} />
                  ))}
                  <span className="text-[14px] text-muted-foreground ml-2">({averageRating}/5 Rating)</span>
                </div>
              </div>
              
              <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-5xl font-black tracking-tight leading-tight text-[#310101]">
                {product.name}
              </h1>
              
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex flex-wrap items-end gap-3 pt-2">
                  {product.discountPrice ? (
                    <>
                      <span className="text-4xl sm:text-[45px] font-sans font-black text-black leading-none tracking-tight">
                        {"\u20B9"}{parseInt(product.discountPrice.replace(/[^\d]/g, "")).toLocaleString()}
                      </span>
                      <span className="text-[#747e8e] line-through text-xl md:text-[22px] font-sans font-bold pb-[2px] ml-1">
                        {"\u20B9"}{parseInt(product.price.replace(/[^\d]/g, "")).toLocaleString()}
                      </span>
                      {(() => {
                        const rP = parseInt(product.price.replace(/[^\d]/g, "") || "0");
                        const rD = parseInt(product.discountPrice.replace(/[^\d]/g, "") || "0");
                        if (rP > 0 && rD > 0) {
                          const pct = Math.round(((rP - rD) / rP) * 100);
                          return (
                            <span className="bg-[#489b6f] text-white text-[14px] font-sans font-black px-2 py-0.5 rounded tracking-wide ml-1 mb-[3px]">
                              {pct}% off
                            </span>
                          );
                        }
                        return null;
                      })()}
                    </>
                  ) : (
                    <span className="text-4xl sm:text-[45px] font-sans font-black text-black leading-none tracking-tight">
                      {"\u20B9"}{parseInt(product.price.replace(/[^\d]/g, "")).toLocaleString()}
                    </span>
                  )}
                </div>

                <span className="text-[15px] text-muted-foreground uppercase tracking-widest block mt-4">Inclusive of all taxes</span>
              </div>
            </header>

            <div className="space-y-6">
              <p className="text-muted-foreground font-sans leading-relaxed tracking-wide">
                {product.description || "Indulge in the luxury of Kaleemiya Signature. This exquisite product is meticulously crafted using the finest materials and traditional techniques, ensuring a premium experience that nourishes the soul."}
              </p>

              {product.highlights && (
                <div className="space-y-4">
                  <h4 className="text-[15px] font-sans font-bold tracking-[0.25em] h-px flex items-center gap-4 text-foreground uppercase">
                    <span>Highlights</span>
                    <span className="bg-border flex-grow h-[1px]"></span>
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6">
                    {product.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-center gap-3 text-sm text-muted-foreground tracking-wide font-sans">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 shadow-[0_0_8px_rgba(201,165,86,0.5)]" />
                        {highlight}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex flex-col gap-4 pt-4">
                <Button 
                  className="w-full py-7 bg-[#DEB87A] hover:bg-[#D0A96B] text-black font-sans font-bold uppercase tracking-wider text-[15px] rounded-full transition-all flex items-center justify-center gap-2"
                  onClick={handleAddToCart}
                >
                  ADD TO CART
                  <ShoppingCart size={20} className="text-black fill-black" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full py-7 text-[15px] font-sans font-bold tracking-wider uppercase rounded-full border-gray-400 hover:border-black hover:bg-black hover:text-white transition-all text-[#111]"
                  onClick={() => {
                    handleAddToCart();
                    setTimeout(() => {
                      const cartBtn = document.querySelector('button .lucide-shopping-cart')?.closest('button') as HTMLButtonElement | null;
                      if (cartBtn) cartBtn.click();
                    }, 50);
                  }}
                >
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Product Specifications */}
            {product.specs && (
              <div className="space-y-4 pt-4">
                <h4 className="text-[15px] font-sans font-bold tracking-[0.25em] h-px flex items-center gap-4 text-foreground uppercase">
                  <span>Specifications</span>
                  <span className="bg-border flex-grow h-[1px]"></span>
                </h4>
                <div className="grid grid-cols-1 gap-1">
                  {Array.isArray(product.specs) ? product.specs.map((spec: any, idx: number) => (
                    <div key={idx} className="flex justify-between py-2 border-b border-border/40 last:border-0 text-sm font-sans">
                      <span className="text-muted-foreground tracking-wide uppercase">{spec.label || "Detail"}</span>
                      <span className="text-foreground font-medium tracking-wide">{spec.value || "—"}</span>
                    </div>
                  )) : Object.entries(product.specs || {}).map(([key, value]: [string, any]) => (
                    <div key={key} className="flex justify-between py-2 border-b border-border/40 last:border-0 text-sm font-sans">
                      <span className="text-muted-foreground tracking-wide uppercase">{key}</span>
                      <span className="text-foreground font-medium tracking-wide">{typeof value === 'object' ? (value.value || JSON.stringify(value)) : value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reassurance Icons */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 py-8 border-y border-border/40">
              <div className="flex flex-col items-center text-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary/70" />
                <span className="text-[11px] font-sans font-bold tracking-[0.1em] text-muted-foreground uppercase leading-tight">Authentic Heritage</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Truck className="w-5 h-5 text-primary/70" />
                <span className="text-[11px] font-sans font-bold tracking-[0.1em] text-muted-foreground uppercase leading-tight">Global Shipping</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <Star className="w-5 h-5 text-primary/70" />
                <span className="text-[11px] font-sans font-bold tracking-[0.1em] text-muted-foreground uppercase leading-tight">Premium Quality</span>
              </div>
              <div className="flex flex-col items-center text-center gap-2">
                <RotateCcw className="w-5 h-5 text-primary/70" />
                <span className="text-[11px] font-sans font-bold tracking-[0.1em] text-muted-foreground uppercase leading-tight">Safe Returns</span>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Reflections Section */}
        <section className="mt-24 md:mt-40 max-w-4xl mx-auto space-y-16">
           <div className="text-center space-y-4">
              <h2 className="text-3xl sm:text-4xl font-serif italic text-[#310101] tracking-tight">Customer Reflections</h2>
              <p className="text-[13px] font-black uppercase tracking-[0.3em] text-[#B0843D]">Shared Experiences</p>
           </div>

           {/* Review Form */}
           {user ? (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               className="bg-white rounded-[50px] p-12 border shadow-sm space-y-8"
             >
                <div className="flex flex-col items-center gap-4">
                   <p className="text-[14px] font-black uppercase tracking-widest opacity-30">Rate your experience</p>
                   <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                         <button 
                           key={star} 
                           onClick={() => setNewReview({ ...newReview, rating: star })}
                           type="button"
                           className="transition-transform active:scale-95"
                         >
                            <Star className={`w-8 h-8 ${newReview.rating >= star ? "text-amber-500 fill-current" : "text-gray-200"}`} />
                         </button>
                      ))}
                   </div>
                </div>
                <form onSubmit={handleReviewSubmit} className="space-y-6">
                   <textarea 
                     required
                     value={newReview.comment}
                     onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                     placeholder="Share your experience with this essence..."
                     className="w-full h-32 bg-gray-50 rounded-[20px] sm:rounded-[30px] p-4 sm:p-8 outline-none text-lg font-serif italic focus:ring-2 ring-[#B0843D]/20 transition-all border-none"
                   />
                   <Button 
                     type="submit" 
                     disabled={isSubmitting}
                     className="w-full py-8 bg-[#310101] text-white font-black uppercase tracking-widest rounded-full hover:scale-[1.02] transition-all"
                   >
                     {isSubmitting ? "Syncing..." : "Submit My Reflection"}
                   </Button>
                </form>
             </motion.div>
           ) : (
             <div className="bg-gray-50 rounded-[40px] p-12 text-center space-y-6 border border-dashed">
                <p className="text-xl font-serif italic opacity-40">Please sign in to share your Signature experience.</p>
                <Button onClick={() => navigate("/login")} className="bg-[#B0843D] text-white px-10 py-5 rounded-full uppercase font-black text-xs tracking-[0.2em] shadow-lg">Sign In to Rate</Button>
             </div>
           )}

           {/* Reviews List */}
           <div className="space-y-12">
              {reviews.length > 0 ? (
                reviews.map((rev) => (
                  <motion.div 
                    key={rev.id}
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    className="space-y-4 border-b border-gray-100 pb-12 last:border-0"
                  >
                     <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-full bg-[#F9F6F2] flex items-center justify-center font-serif font-black text-[#310101] text-xl">
                              {rev.userName?.charAt(0) || "G"}
                           </div>
                           <div>
                              <h5 className="text-[16px] font-black text-[#310101] uppercase tracking-widest">{rev.userName}</h5>
                              <p className="text-[11px] text-black/30 font-black uppercase tracking-widest">
                                {rev.createdAt 
                                  ? rev.createdAt.toDate().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
                                  : "Just Now"}
                              </p>
                           </div>
                        </div>
                        <div className="flex items-start gap-4">
                           <div className="flex gap-1 pt-1">
                              {[...Array(5)].map((_, i) => (
                                 <Star key={i} className={`w-3 h-3 ${i < rev.rating ? "text-amber-500 fill-current" : "text-gray-100"}`} />
                              ))}
                           </div>
                           {(role === 'admin' || role === 'super_admin') && (
                             <button 
                               onClick={() => handleDeleteReview(rev.id)}
                               className="text-red-300 hover:text-red-500 transition-all p-1 hover:bg-red-50 rounded-lg -mt-1"
                               title="Delete Reflection"
                             >
                               <Trash2 size={16} />
                             </button>
                           )}
                        </div>
                     </div>
                     <p className="text-lg font-serif italic text-black/70 leading-relaxed pl-16">
                        "{rev.comment}"
                     </p>
                  </motion.div>
                ))
              ) : (
                <div className="py-20 text-center space-y-4 opacity-20">
                   <Star className="w-12 h-12 mx-auto" />
                   <p className="text-xl font-serif italic">No reflections shared yet. Be the first to share your experience.</p>
                </div>
              )}
           </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;
