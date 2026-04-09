import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

const PolicyLayout = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <div className="min-h-screen bg-[#FDFCFB]">
    <Header />
    <div className="h-24 md:h-32"></div>
    <main className="max-w-4xl mx-auto px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <h1 className="font-serif text-4xl md:text-5xl text-[#310101] mb-12 border-b border-[#310101]/10 pb-8">{title}</h1>
        <div className="prose prose-stone max-w-none prose-h3:font-serif prose-h3:text-[#310101] prose-h3:text-xl prose-p:text-[#310101] prose-p:leading-relaxed prose-li:text-[#310101] font-sans">
          {children}
        </div>
      </motion.div>
    </main>
    <Footer />
  </div>
);

const Returns = () => (
  <PolicyLayout title="Returns & Exchanges">
    <p>We take pride in our Signature curation. If your order doesn't meet your expectations, we provide a streamlined return process.</p>
    
    <h3>1. Initiation of Returns</h3>
    <p>To initiate a return, please contact our support team at support@kaleemiya.com with your order number. We will guide you through the next steps.</p>
    
    <h3>2. Return Criteria</h3>
    <p>Items must be in original, unopened, and unused condition. Proof of purchase is required for all returns.</p>
    
    <h3>3. Exchange Options</h3>
    <p>If you're looking for a different fragrance, we offer one-time exchanges for products of equal value, subject to availability.</p>
    
    <h3>4. Process Timeline</h3>
    <p>Once we receive your return, the inspection and credit process usually takes 7 business days.</p>
  </PolicyLayout>
);

export default Returns;
