import { Mail, Phone, MapPin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import SectionHeading from "./SectionHeading";
import { useState } from "react";
import { toast } from "sonner";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { motion } from "framer-motion";

const ContactSection = () => {
  const [formData, setFormData] = useState({ name: "", email: "", message: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill out all fields.");
      return;
    }

    try {
      await addDoc(collection(db, "inquiries"), {
        name: formData.name,
        email: formData.email,
        message: formData.message,
        createdAt: serverTimestamp(),
        status: "unread"
      });
      toast.success("Your inquiry has been sent directly to the Kaleemiya team!");
      setFormData({ name: "", email: "", message: "" });
    } catch (error: any) {
      toast.error("Failed to send inquiry: " + error.message);
    }
  };

  return (
    <section id="contact" className="py-24 overflow-hidden bg-background relative z-10">
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20">
        <SectionHeading title="Contact Us" subtitle="Visit our physical Signature or reach out for inquiries." />
      </div>
      
      <div className="max-w-[1440px] mx-auto px-6 md:px-12 lg:px-20 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          
          {/* Contact Details & Info Card */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="bg-card border border-border/40 p-10 rounded-sm shadow-xl space-y-10 order-2 lg:order-1"
          >
            <div>
              <h3 className="font-serif text-3xl mb-4 text-foreground tracking-wide">Get in Touch</h3>
              <p className="text-muted-foreground font-sans text-sm leading-relaxed max-w-lg mb-8">
                Whether you have questions about our collection or seek a personalized fragrance consultation, our artisans are here to assist you.
              </p>
              
              <div className="space-y-6">
                <div className="flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-serif text-base text-foreground mb-1">Our Signature</h4>
                    <address className="not-italic text-muted-foreground font-sans text-sm leading-relaxed">
                      Govt Hospital, 11-2-828, Niyaz Heights,<br />
                      Mallepally Road, Jamia Masjid Rd, Hyderabad, 500001
                    </address>
                  </div>
                </div>
                
                <div className="flex gap-5 items-start">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Phone className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-serif text-base text-foreground mb-1">Call Us</h4>
                    <div className="flex flex-col">
                      <a href="tel:+919885655591" className="text-muted-foreground font-sans text-sm hover:text-primary transition-colors">
                        +91 98856 55591
                      </a>
                      <a href="tel:+919885655592" className="text-muted-foreground font-sans text-sm hover:text-primary transition-colors">
                        +91 98856 55592
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="pt-6 border-t border-border/40">
              <h4 className="font-serif text-lg text-foreground mb-6">Send an Inquiry</h4>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Name" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="bg-muted/30 border border-border/50 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50" 
                  />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    className="bg-muted/30 border border-border/50 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50" 
                  />
                </div>
                <textarea 
                  placeholder="How can we help?" 
                  rows={3} 
                  value={formData.message}
                  onChange={(e) => setFormData({...formData, message: e.target.value})}
                  className="w-full bg-muted/30 border border-border/50 rounded-sm px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50" 
                />
                <Button type="submit" variant="gold" className="w-full md:w-auto px-10 text-[14px] tracking-[0.2em] uppercase rounded-sm h-10">
                  Submit Inquiry
                </Button>
              </form>
            </div>
          </motion.div>
          
          {/* Google Maps Embed */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative h-[320px] lg:h-[400px] rounded-2xl overflow-hidden border border-primary/20 shadow-2xl order-1 lg:order-2 self-start"
          >
            <iframe 
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d1712.920979310862!2d78.460492576025!3d17.381375396558666!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb977980125195%3A0x98245389af2a7b69!2sKaleemiya%20Islamic%20books%20Store%20Perfumes%20and%20more!5e1!3m2!1sen!2sin!4v1711462000000!5m2!1sen!2sin"
              width="100%" 
              height="100%" 
              style={{ border: 0, filter: "grayscale(0.6) invert(0.9) contrast(1.1) brightness(0.9)" }} 
              allowFullScreen={true} 
              loading="lazy" 
              referrerPolicy="no-referrer-when-downgrade"
              title="Kaleemiya Islamic Books Store & Perfumes"
            ></iframe>
            <div className="absolute top-4 left-4">
              <a 
                href="https://www.google.com/maps/place/Kaleemiya+Islamic+books+Store+Perfumes+and+more/@17.3813754,78.4604926,17z/data=!4m2!3m1!1s0x3bcb977980125195:0x98245389af2a7b69" 
                target="_blank" 
                rel="noopener noreferrer"
                className="bg-[#310101]/95 backdrop-blur-sm border border-primary/40 px-4 py-2.5 rounded-full text-[11px] text-[#F9F6F0] uppercase tracking-[0.2em] font-bold hover:bg-primary transition-all shadow-xl flex items-center gap-2"
              >
                OPEN IN MAPS <Send className="w-3 h-3 text-primary group-hover:text-white" />
              </a>
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
