import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Search, Loader2, Package, CheckCircle2, ChevronRight, MapPin, Truck, Box } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "sonner";

const TrackOrder = () => {
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [tracking, setTracking] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleTrack = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId) {
      toast.error("Please enter an Order ID");
      return;
    }
    
    setTracking(true);
    setResult(null);
    
    try {
      const q = query(
        collection(db, "orders"),
        where("id", "==", orderId.trim().toUpperCase())
      );
      
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        toast.error("Order not found. Please check your ID.");
        setResult(null);
      } else {
        const orderData = querySnapshot.docs[0].data();
        
        // Basic Status Timeline Logic
        const status = orderData.status || "Processing";
        const history = [
          { status: "Order Confirmed", date: "Artisan Verification Complete", icon: <Box className="w-5 h-5" />, completed: true },
          { status: "Quality Check", date: "Perfume Maturity Verified", icon: <CheckCircle2 className="w-5 h-5" />, completed: true },
          { status: "In Transit", date: "Departed from Hub", icon: <Truck className="w-5 h-5" />, completed: ["In Transit", "Delivered"].includes(status) },
          { status: "Delivery", date: "Handed over to carrier", icon: <MapPin className="w-5 h-5" />, completed: status === "Delivered" },
        ];

        setResult({
          ...orderData,
          history
        });
        toast.success("Signature Order Found");
      }
    } catch (err: any) {
      toast.error("Lookup failed. Please try again later.");
    } finally {
      setTracking(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB]">
      <Header />
      <div className="h-24 md:h-32"></div>
      <main className="max-w-4xl mx-auto px-6 py-20">
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="text-center"
        >
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-[#310101] mb-6 px-4">Track Your Signature Order</h1>
          <p className="text-[#310101] font-sans text-sm mb-12 max-w-lg mx-auto">
             Enter your order ID below to view the current status of your premium fragrance shipment.
          </p>

          <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-20">
            <input 
              type="text"
              placeholder="Order ID (e.g., ORD-7239)"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="flex-1 bg-white border border-[#310101]/10 rounded-full px-8 py-5 font-sans focus:outline-none focus:border-[#B0843D]/40 transition-colors shadow-sm text-lg font-bold"
            />
            <button 
              type="submit"
              disabled={tracking}
              className="px-10 py-5 bg-[#310101] text-[#E5D5C5] rounded-full font-black uppercase text-[14px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {tracking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              {tracking ? "Syncing..." : "Find Order"}
            </button>
          </form>

          <AnimatePresence>
            {result && (
              <motion.div 
                 initial={{ opacity: 0, scale: 0.95 }}
                 animate={{ opacity: 1, scale: 1 }}
                 className="bg-white border border-[#310101]/10 rounded-[30px] sm:rounded-[40px] p-6 sm:p-10 shadow-2xl text-left max-w-2xl mx-auto"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-10 pb-10 border-b border-[#310101]/5 gap-6">
                  <div className="flex items-center gap-6">
                     <div className="p-4 bg-[#F9F6F2] rounded-2xl shrink-0">
                        <Package className="w-8 h-8 text-[#B0843D]" />
                     </div>
                     <div>
                        <h3 className="font-serif text-2xl text-[#310101]">{result.id}</h3>
                         <p className="text-[11px] sm:text-sm uppercase tracking-widest font-black text-white px-3 py-1 bg-green-600 rounded-lg mt-2 inline-block">
                            {result.status}
                         </p>
                         <p className="text-[13px] font-sans font-bold text-black/40 mt-3 italic">
                           Customer: {result.customer}
                         </p>
                      </div>
                  </div>
                  <div className="text-left sm:text-right">
                     <p className="text-[14px] font-black uppercase tracking-[0.2em] text-[#310101]/90 mb-1">Total Amount</p>
                     <p className="font-serif text-2xl font-black text-green-700">{result.amount}</p>
                  </div>
                </div>

                <div className="space-y-8">
                   {result.history.map((step: any, i: number) => (
                    <div key={i} className="flex gap-6 relative">
                       {i < result.history.length - 1 && (
                         <div className={`absolute top-10 left-[11px] w-0.5 h-full ${step.completed ? "bg-green-500" : "bg-[#310101]/10"}`} />
                       )}
                       <div className={`w-6 h-6 shrink-0 flex items-center justify-center rounded-full z-10 transition-colors ${step.completed ? "bg-green-500 text-white" : "bg-gray-100 text-gray-300"}`}>
                          {step.icon}
                       </div>
                       <div className="flex-1 border-b border-gray-50 pb-6 last:border-0">
                          <p className={`font-serif text-lg ${step.completed ? "text-[#310101]" : "text-black/20"}`}>{step.status}</p>
                          <p className="text-[12px] uppercase tracking-widest font-black text-black/30 mt-1">{step.date}</p>
                       </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default TrackOrder;
