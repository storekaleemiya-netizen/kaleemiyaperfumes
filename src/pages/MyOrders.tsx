import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";
import { Package, ShoppingBag, Truck, Calendar, ChevronRight, ArrowLeft } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";

const MyOrders = () => {
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!authLoading && !user) {
            toast.error("Please login to view your orders");
            navigate("/shop");
            return;
        }

        const fetchOrders = async () => {
            if (!user) return;
            try {
                const q = query(
                    collection(db, "orders"),
                    where("userId", "==", user.uid)
                );
                const snapshot = await getDocs(q);
                const orderData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                
                // Sort client-side to avoid index requirements
                orderData.sort((a: any, b: any) => {
                    const dateA = a.createdAt?.toDate?.() || new Date(a.createdAt || 0);
                    const dateB = b.createdAt?.toDate?.() || new Date(b.createdAt || 0);
                    return dateB.getTime() - dateA.getTime();
                });
                
                setOrders(orderData);
            } catch (error) {
                console.error("Error fetching orders:", error);
                // Silence the toast if it's just an index error, but log it
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, [user, authLoading, navigate]);

    if (authLoading || loading) {
        return (
            <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-4 border-[#310101]/10 border-t-[#B0843D] animate-spin" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#310101]/40">Gathering Legacy...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFCFB]">
            <Header />
            <div className="h-24 md:h-32" />
            
            <main className="max-w-4xl mx-auto px-6 py-12 md:py-20">
                <header className="mb-12 space-y-4">
                    <button 
                        onClick={() => navigate("/")}
                        className="group flex items-center gap-2 text-[#310101]/40 hover:text-[#310101] transition-colors mb-6"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Return Home</span>
                    </button>
                    <h1 className="font-serif text-4xl md:text-5xl text-[#310101] italic">My Artisan Journey</h1>
                    <p className="text-[#310101]/60 font-sans text-sm tracking-wide max-w-md uppercase">A curated timeline of your fragrance acquisitions</p>
                </header>

                <div className="space-y-8">
                    {orders.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white border border-[#310101]/5 rounded-[40px] p-20 text-center space-y-8 shadow-sm"
                        >
                            <div className="w-24 h-24 bg-[#F9F6F2] rounded-full flex items-center justify-center mx-auto">
                                <ShoppingBag className="w-10 h-10 text-[#B0843D]/30" />
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-serif text-2xl text-[#310101]">Aapne abhi tak koi order nahi kiya hai</h3>
                                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-black/40">Hamari behtareen collections browse karein aur apna pehla order dein!</p>
                            </div>
                            <Link 
                                to="/shop"
                                className="inline-block px-12 py-5 bg-[#310101] text-white rounded-full font-black uppercase text-[12px] tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all"
                            >
                                Browse Collections
                            </Link>
                        </motion.div>
                    ) : (
                        orders.map((order, idx) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="group bg-white border border-[#310101]/5 rounded-[40px] overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500"
                            >
                                <div className="p-8 sm:p-10">
                                    <div className="flex flex-col sm:flex-row justify-between gap-6 mb-8 items-start sm:items-center">
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-[#F9F6F2] rounded-2xl flex items-center justify-center shrink-0">
                                                <Package className="w-6 h-6 text-[#B0843D]" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B0843D] mb-1">Order Identifier</p>
                                                <h3 className="font-serif text-2xl text-[#310101]">{order.orderId || order.id.substring(0, 8).toUpperCase()}</h3>
                                            </div>
                                        </div>
                                        <div className="flex flex-col sm:items-end">
                                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/40 mb-1">Status</p>
                                            <span className="px-5 py-2 bg-green-50 text-green-700 rounded-full font-black uppercase text-[10px] tracking-[0.2em] border border-green-100 italic">
                                                {order.status || "Established"}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-[#310101]/5">
                                        <div className="flex items-start gap-4">
                                            <Calendar className="w-5 h-5 text-[#B0843D]/60 mt-1" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30 mb-1">Creation Date</p>
                                                <p className="text-[13px] font-black text-[#310101]">
                                                    {order.createdAt?.toDate().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) || "Artisan Date N/A"}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <ShoppingBag className="w-5 h-5 text-[#B0843D]/60 mt-1" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30 mb-1">Items In Order</p>
                                                <p className="text-[13px] font-black text-[#310101]">{order.items?.length || 0} Artifacts</p>
                                            </div>
                                        </div>
                                        <div className="flex items-start gap-4">
                                            <Truck className="w-5 h-5 text-[#B0843D]/60 mt-1" />
                                            <div>
                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-black/30 mb-1">Total Valuation</p>
                                                <p className="text-xl font-serif font-black text-green-700 italic">₹{order.totalAmount?.toLocaleString()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Items Preview */}
                                    <div className="mt-8 flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                                        {order.items?.map((item: any, i: number) => (
                                            <div key={i} className="flex-shrink-0 w-16 h-16 bg-[#F9F6F2] rounded-xl p-2 border border-black/5">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-contain mix-blend-multiply" />
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-8 flex justify-end">
                                        <button 
                                            onClick={() => navigate("/track-order", { state: { orderId: order.orderId || order.id } })}
                                            className="px-8 py-4 border border-[#310101]/10 rounded-full flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-[#310101] hover:text-white transition-all group"
                                        >
                                            Detailed Tracking
                                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default MyOrders;
