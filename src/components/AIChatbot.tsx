import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, Send, X, Bot, User, Sparkles } from "lucide-react";
import Groq from "groq-sdk";
import { allProducts } from "@/data/products";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

// Initialize Groq
const groq = new Groq({
  apiKey: import.meta.env.VITE_GROQ_API_KEY,
  dangerouslyAllowBrowser: true // For demo purposes
});

const AIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content: "As-salamu alaykum! Welcome to Kaleemiya. How can I help you find the perfect fragrance today?",
      timestamp: new Date()
    }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);





  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const chatCompletion = await groq.chat.completions.create({
        messages: [
          {
            role: "system",
            content: `You are the concierge for Kaleemiya Perfumes. 
            RULES:
            - Start with "As-salamu alaykum" ONLY for the very first greeting. 
            - IF the user says "Walaikum assalam" or starts a conversation, do NOT repeat the greeting. Instead, say "How may I specifically assist you today with our fragrances?" or "Please tell me what type of scent you are looking for."
            - DATA ONLY: Use this list: ${allProducts.map(p => `${p.name} (${p.category}): ${p.price}`).join(" | ")}
            - IF a user asks for something missing, offer the closest match from the list.
            - LOCATION: Govt Hospital, 11-2-828, Niyaz Heights Mallepally Road, Hyderabad.
            - Be premium, concise, and professional.`
          },
          ...messages.map(m => ({ role: m.role, content: m.content })),
          { role: "user", content: currentInput }
        ],
        model: "llama-3.3-70b-versatile",
      });

      const response = chatCompletion.choices[0]?.message?.content || "I apologize, I'm having trouble connecting. How else can I help?";
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMsg]);

    } catch (error) {
      console.error("Groq Error:", error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "I'm sorry, I'm experiencing a technical issue. Please visit our Signature or try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="mb-3 w-[290px] md:w-[330px] h-[420px] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="p-3 gold-gradient-bg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="font-serif text-white font-bold text-sm">Kaleemiya AI</h3>
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                    <span className="text-[11px] text-white/80 uppercase tracking-wider">Online</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-hide bg-[#fafafa]"
            >
              {messages.map((m) => (
                <div 
                  key={m.id}
                  className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] p-2.5 rounded-xl text-[12.5px] font-sans leading-relaxed ${
                    m.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-none shadow-sm' 
                      : 'bg-white border border-gray-100 rounded-tl-none text-zinc-900 shadow-sm'
                  }`}>
                    {m.content}
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-100 p-2.5 rounded-xl rounded-tl-none shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1 h-1 bg-muted-foreground/30 rounded-full animate-bounce"></span>
                      <span className="w-1 h-1 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1 h-1 bg-muted-foreground/30 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border bg-white">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="Ask a question..."
                  className="w-full bg-muted/20 border border-gray-100 rounded-lg py-2 pl-3 pr-10 text-sm text-zinc-900 focus:outline-none focus:border-primary/40 focus:bg-white transition-all shadow-inner"
                />
                <button 
                  onClick={handleSend}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 bg-primary text-primary-foreground rounded-md hover:brightness-110 transition-all"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 rounded-full gold-gradient-bg shadow-xl flex items-center justify-center text-white relative group border border-white/20"
      >
        {isOpen ? <X className="w-5 h-5" /> : <MessageSquare className="w-5 h-5 flex-shrink-0" />}
        {!isOpen && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary text-[11px] items-center justify-center font-bold border border-white/40 shadow-sm">1</span>
          </span>
        )}
        <div className="absolute right-full mr-3 bg-background border border-border py-1.5 px-3 rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none hidden md:block">
          <p className="text-[14px] uppercase font-sans tracking-widest font-bold text-foreground flex items-center gap-2">
            <Sparkles className="w-3 h-3 text-primary" />
            Concierge
          </p>
        </div>
      </motion.button>
    </div>
  );
};

export default AIChatbot;
