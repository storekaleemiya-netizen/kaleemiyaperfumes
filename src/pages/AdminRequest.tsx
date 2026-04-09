import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { db } from "../lib/firebase";
import { collection, addDoc, query, where, getDocs, Timestamp, onSnapshot } from "firebase/firestore";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { ShieldCheck, Loader2 } from "lucide-react";

const AdminRequest = () => {
  const { user, role, loading: authLoading } = useAuth();
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [existingRequest, setExistingRequest] = useState<any>(null);
  const [checkLoading, setCheckLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error("Please login to request admin access");
      navigate("/");
      return;
    }

    if (user) {
      const q = query(collection(db, "adminRequests"), where("uid", "==", user.uid));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const requests = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          // Find if there's any pending or approved request
          const pending = requests.find((r: any) => r.status === "pending" || r.status === "approved");
          setExistingRequest(pending || requests[0]);
        }
        setCheckLoading(false);
      });
      return () => unsubscribe();
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!reason.trim()) {
      toast.error("Please provide a reason for your request");
      return;
    }

    setSubmitting(true);
    try {
      // Check for duplicate again just in case
      const q = query(collection(db, "adminRequests"), 
        where("uid", "==", user.uid), 
        where("status", "in", ["pending", "approved"])
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        toast.error("You already have a pending or approved request.");
        setSubmitting(false);
        return;
      }

      const { doc, setDoc } = await import("firebase/firestore");
      await setDoc(doc(db, "adminRequests", user.uid), {
        uid: user.uid,
        name: user.displayName || "Unknown User",
        email: user.email,
        reason: reason,
        status: "pending",
        createdAt: Timestamp.now()
      });
      toast.success("Admin request submitted successfully!");
      setReason("");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || checkLoading) {
    return (
      <div className="min-h-screen bg-[#FDFCFB] flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#310101]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] py-20 px-6">
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-[50px] p-12 shadow-xl border border-gray-100 space-y-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
          <div className="flex flex-col items-center text-center gap-6">
            <div className="w-20 h-20 rounded-[30px] bg-[#310101] text-white flex items-center justify-center shadow-2xl">
              <ShieldCheck className="w-10 h-10" />
            </div>
            <div className="space-y-2">
              <h1 className="text-4xl font-serif font-black text-black">Admin Access Request</h1>
              <p className="text-black/50 font-bold uppercase tracking-widest text-[15px]">Signature Authority Portal</p>
            </div>
          </div>

          {role === "admin" || role === "super_admin" ? (
            <div className="bg-green-50 border border-green-100 rounded-3xl p-8 text-center space-y-4">
              <p className="text-green-800 font-black uppercase tracking-widest text-sm">Access Already Granted</p>
              <p className="text-green-700 font-medium italic">You are currently logged in as an {role}.</p>
              <button 
                onClick={() => navigate("/admin")}
                className="w-full bg-[#310101] text-white py-5 rounded-[22px] font-black uppercase tracking-widest text-[14px] shadow-xl hover:scale-105 transition-transform"
              >
                Go to Admin Dashboard
              </button>
            </div>
          ) : existingRequest ? (
            <div className={`p-8 rounded-3xl text-center space-y-4 border ${
              existingRequest.status === "pending" ? "bg-orange-50 border-orange-100" : 
              existingRequest.status === "approved" ? "bg-green-50 border-green-100" : "bg-red-50 border-red-100"
            }`}>
              <p className={`font-black uppercase tracking-widest text-sm ${
                existingRequest.status === "pending" ? "text-orange-800" : 
                existingRequest.status === "approved" ? "text-green-800" : "text-red-800"
              }`}>
                Request {existingRequest.status}
              </p>
              <p className="text-black/60 font-medium italic">
                {existingRequest.status === "pending" && "Your request is being reviewed by the super admin."}
                {existingRequest.status === "rejected" && "Your request was not approved. You can contact support for more information."}
              </p>
              {existingRequest.status === "rejected" && (
                <button 
                  onClick={() => setExistingRequest(null)}
                  className="w-full bg-[#310101] text-white py-5 rounded-[22px] font-black uppercase tracking-widest text-[14px] mt-4"
                >
                  Submit New Request
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[15px] font-black uppercase tracking-[0.3em] text-black/40 ml-1">Why do you need admin access?</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. I need to manage new arrivals and update inventory..."
                  className="w-full bg-[#FDFCFB] border border-gray-100 rounded-3xl px-8 py-6 text-lg font-bold text-black outline-none focus:border-[#B0843D] transition-colors shadow-inner min-h-[150px] resize-none"
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-[#310101] text-white py-6 rounded-[30px] font-black uppercase tracking-[0.3em] text-[15px] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                {submitting ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  <span className="flex items-center justify-center gap-3">
                    Submit Request <ShieldCheck className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  </span>
                )}
              </button>
            </form>
          )}

          <div className="pt-6 border-t border-gray-50 flex justify-center">
            <button 
              onClick={() => navigate("/")}
              className="text-[15px] font-black uppercase tracking-widest text-black/30 hover:text-[#310101] transition-colors"
            >
              Return to Storefront
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminRequest;
