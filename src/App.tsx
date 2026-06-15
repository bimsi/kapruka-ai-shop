import React, { useState, useEffect } from "react";
import { ChatInterface } from "./components/chat-interface";
import { ProductDisplay } from "./components/product-display";
import { KaprukaProduct, ChatMessage, CartItem, DeliveryInfo } from "./types/mcp";
import { 
  ShoppingCart, 
  MapPin, 
  CreditCard, 
  Trash2, 
  Plus, 
  Minus, 
  Download, 
  Sparkles, 
  Award,
  Check,
  ExternalLink,
  MessageSquareCode,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "model",
    content: `Ayubowan! 🙏 Welcome to the Kapruka AI Shopping Assistant.

I have direct real-time access to the live Kapruka catalog for fresh cakes, lovely floral bouquets, festive hampers, and exquisite toys. 

Oyata puluwan Sinhalaen ho Tanglishen katha karanna (e.g., "Mata chocolate cake thiyenawda search karanna"). I will translate your request, search our live catalog, and reply back to you in your native script instantly!

How can I help you choose the perfect item today?`,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  }
];

export default function App() {
  // --- Persistent Localized States ---
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem("kapruka_messages");
      return saved ? JSON.parse(saved) : INITIAL_MESSAGES;
    } catch {
      return INITIAL_MESSAGES;
    }
  });

  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem("kapruka_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [delivery, setDelivery] = useState<DeliveryInfo>(() => {
    try {
      const saved = localStorage.getItem("kapruka_delivery");
      return saved ? JSON.parse(saved) : {
        customerName: "",
        customerPhone: "",
        deliveryAddress: "",
        deliveryDate: "",
        specialInstructions: ""
      };
    } catch {
      return {
        customerName: "",
        customerPhone: "",
        deliveryAddress: "",
        deliveryDate: "",
        specialInstructions: ""
      };
    }
  });

  const [products, setProducts] = useState<KaprukaProduct[]>(() => {
    try {
      const saved = localStorage.getItem("kapruka_products");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeTab, setActiveTab] = useState<"catalog" | "cart" | "delivery" | "checkout">("catalog");
  const [currentStep, setCurrentStep] = useState<"search" | "cart" | "details" | "checkout">("search");
  
  const [isThinking, setIsThinking] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [activeLanguageContext, setActiveLanguageContext] = useState("English");
  const [checkoutPayLink, setCheckoutPayLink] = useState<string | null>(null);

  // --- High-Speed Frontend Search-Term Cache matching user text phrases ---
  const [frontendProductCache, setFrontendProductCache] = useState<Record<string, KaprukaProduct[]>>(() => {
    try {
      const saved = localStorage.getItem("kapruka_frontend_cache");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("kapruka_frontend_cache", JSON.stringify(frontendProductCache));
  }, [frontendProductCache]);

  // --- Write updates to LocalStorage to protect during context-resets ---
  useEffect(() => {
    localStorage.setItem("kapruka_messages", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem("kapruka_cart", JSON.stringify(cartItems));
    if (cartItems.length > 0 && currentStep === "search") {
      setCurrentStep("cart");
    }
  }, [cartItems]);

  useEffect(() => {
    localStorage.setItem("kapruka_delivery", JSON.stringify(delivery));
  }, [delivery]);

  useEffect(() => {
    localStorage.setItem("kapruka_products", JSON.stringify(products));
  }, [products]);

  // --- Step & Tab Synchronizer ---
  useEffect(() => {
    if (currentStep === "checkout") {
      setActiveTab("checkout");
    } else if (currentStep === "details") {
      setActiveTab("delivery");
    } else if (currentStep === "cart") {
      setActiveTab("cart");
    } else {
      setActiveTab("catalog");
    }
  }, [currentStep]);

  // --- Cart actions ---
  const handleAddToCart = (product: KaprukaProduct) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return [...prev, { product, quantity: 1 }];
    });

    // Notify user in chat
    const alertMessage: ChatMessage = {
      id: `cart-add-${Date.now()}`,
      role: "system",
      content: `🛒 Added "${product.title}" to your Kapruka Cart.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, alertMessage]);
    setCurrentStep("cart");
  };

  const handleUpdateQty = (productId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
    setCurrentStep("search");
  };

  // --- Send Message to Gemini Edge API ---
  const handleSendMessage = async (text: string) => {
    // 1. Add user message
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    setCheckoutPayLink(null);

    // Try to find a matching product list in the frontend catalog cache to display instantly
    const normalizedPrompt = text.toLowerCase().trim();
    let cacheMatchKey = "";
    
    if (normalizedPrompt.includes("cake") || normalizedPrompt.includes("gateau") || normalizedPrompt.includes("gâteau") || normalizedPrompt.includes("keki")) {
      cacheMatchKey = "cakes";
    } else if (normalizedPrompt.includes("flower") || normalizedPrompt.includes("rose") || normalizedPrompt.includes("lily") || normalizedPrompt.includes("mal") || normalizedPrompt.includes("bouquet") || normalizedPrompt.includes("pushpa")) {
      cacheMatchKey = "flowers";
    } else if (normalizedPrompt.includes("gift") || normalizedPrompt.includes("chocolate") || normalizedPrompt.includes("teddy") || normalizedPrompt.includes("hamper") || normalizedPrompt.includes("thiyagaya") || normalizedPrompt.includes("soft toy")) {
      cacheMatchKey = "gifts";
    } else if (frontendProductCache[normalizedPrompt]) {
      cacheMatchKey = normalizedPrompt;
    }

    if (cacheMatchKey && frontendProductCache[cacheMatchKey]) {
      // Instant UI pre-load!
      setProducts(frontendProductCache[cacheMatchKey]);
      setActiveTab("catalog");
    }

    // Call dynamic progress steps depending on inputs
    if (text.toLowerCase().includes("checkout") || text.toLowerCase().includes("lupa") || text.toLowerCase().includes("pay")) {
      if (cartItems.length > 0) {
        setCurrentStep("details");
      }
    }

    try {
      // Stream parameters
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: [...messages, userMsg].map(({ role, content }) => ({ role, content }))
        })
      });

      if (!response.ok) {
        throw new Error("Failed to communicate with Chat Agent API");
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      if (!reader) return;

      const decoder = new TextDecoder();
      let assistantText = "";
      let newMsgId = `model-${Date.now()}`;
      
      // Setup raw state for streaming content
      setMessages(prev => [
        ...prev,
        {
          id: newMsgId,
          role: "model",
          content: "",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.trim().startsWith("data: ")) {
            try {
              const data = JSON.parse(line.substring(6));
              
              if (data.isSearchStatus) {
                setIsSearching(true);
              }
              
              if (data.text) {
                assistantText += data.text;
                // Update live message content
                setMessages(prev => 
                  prev.map(m => m.id === newMsgId ? { ...m, content: assistantText } : m)
                );
              }

              if (data.products && Array.isArray(data.products)) {
                setProducts(data.products);
                setIsSearching(false);
                // Switch focus back to product visualizer tab
                setActiveTab("catalog");

                // Save search result to cache for lightning-fast subsequent retrievals
                if (cacheMatchKey) {
                  setFrontendProductCache(prev => ({ ...prev, [cacheMatchKey]: data.products }));
                } else if (normalizedPrompt) {
                  setFrontendProductCache(prev => ({ ...prev, [normalizedPrompt]: data.products }));
                }
              }

              if (data.done) {
                setIsThinking(false);
                setIsSearching(false);
              }
            } catch (e) {
              // Parse error or partial chunk
            }
          }
        }
      }

    } catch (err: any) {
      console.error("Chat Error:", err);
      setIsThinking(false);
      setIsSearching(false);
      
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        role: "model",
        content: `Mata samawenna, API server connection problem. (${err.message}). Karunakarala aye try karanna.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, errorMsg]);
    }
  };

  // --- Fast category click ---
  const handleQuickAction = (term: string) => {
    handleSendMessage(term);
  };

  // --- Calculate Totals ---
  const getSubtotal = () => {
    return cartItems.reduce((acc, item) => {
      // Remove leading currency symbols like Rs. or LKR to avoid keeping their abbreviations' dots
      const withoutPrefix = item.product.price.trim().replace(/^(Rs\.|Rs|LKR)\s*/i, "");
      // Now safe to strip all commas and remaining non-digit, non-dot characters
      const priceStr = withoutPrefix.replace(/[^\d.]/g, "");
      const numeric = parseFloat(priceStr) || 0;
      return acc + (numeric * item.quantity);
    }, 0);
  };

  const hasFormErrors = () => {
    return !delivery.customerName.trim() || !delivery.customerPhone.trim() || !delivery.deliveryAddress.trim() || !delivery.deliveryDate.trim();
  };

  const handleCheckoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (hasFormErrors()) return;
    setCurrentStep("checkout");
    
    // Create absolute host url payload for netlify
    const activeHost = window.location.origin || "https://www.kapruka.com";
    const paymentHash = Math.floor(Math.random() * 9000000) + 1000000;
    const generatedUrl = `${activeHost}/checkout/pay?ref=KAP-AI-${paymentHash}&amount=${getSubtotal()}`;
    setCheckoutPayLink(generatedUrl);

    // Notify User in Chat Agent
    const successChatNote: ChatMessage = {
      id: `checkout-${Date.now()}`,
      role: "model",
      content: `🎉 Outstanding! I have processed your cart and compiled your delivery details safely.

Your checkout invoice of Rs. ${getSubtotal().toLocaleString()} is locked in. Click the secure checkout box on the right to complete payment. If you have custom cake messages or special cards, our delivery rider will have them active!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages(prev => [...prev, successChatNote]);
  };

  // Clear messages
  const handleResetThread = () => {
    if (window.confirm("Clear conversation thread?")) {
      setMessages(INITIAL_MESSAGES);
    }
  };

  return (
    <div className="h-[100dvh] w-full flex flex-col md:flex-row bg-gray-100 font-sans text-gray-800 overflow-hidden" id="kapruka-app-root">
      
      {/* 1. Left Side: Chat Agent Panel */}
      <div className="w-full md:w-[35%] md:min-w-[380px] h-[45%] md:h-full flex flex-col bg-white border-b md:border-b-0 md:border-r border-[#E5E7EB] shrink-0">
        <ChatInterface
          messages={messages}
          onSendMessage={handleSendMessage}
          isThinking={isThinking}
          isSearching={isSearching}
          currentStep={currentStep}
          onQuickAction={handleQuickAction}
          activeLanguageContext={activeLanguageContext}
        />
        {messages.length > 1 && (
          <div className="bg-gray-50/50 p-2 border-t border-gray-100 flex justify-end shrink-0">
            <button
              onClick={handleResetThread}
              className="text-[10px] text-gray-400 hover:text-red-600 transition-colors cursor-pointer mr-2 uppercase font-semibold"
            >
              Reset Chat Thread
            </button>
          </div>
        )}
      </div>

      {/* 2. Right Side: Interactive Visual Dashboard Area */}
      <div className="flex-1 h-[55%] md:h-full flex flex-col bg-[#F3F4F6] overflow-hidden">
        
        {/* Navigation Tabs bar matching status Funnel milestones (with safe padding for address bar/notch) */}
        <div className="bg-white border-b border-[#E5E7EB] px-4 py-3 pt-5 md:pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-1 -mb-1 max-w-full">
            <button
              id="tab-btn-catalog"
              onClick={() => setActiveTab("catalog")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider ${
                activeTab === "catalog"
                  ? "bg-[#0046be] text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6]"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Search Results</span>
            </button>

            <button
              id="tab-btn-cart"
              onClick={() => setActiveTab("cart")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer relative uppercase tracking-wider ${
                activeTab === "cart"
                  ? "bg-[#0046be] text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6]"
              }`}
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>My Cart</span>
              {cartItems.length > 0 && (
                <span className="absolute -top-1.5 -right-1 bg-[#f5a623] text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {cartItems.reduce((acc, x) => acc + x.quantity, 0)}
                </span>
              )}
            </button>

            <button
              id="tab-btn-delivery"
              onClick={() => setActiveTab("delivery")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider ${
                activeTab === "delivery"
                  ? "bg-[#0046be] text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6]"
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>Delivery Details</span>
            </button>

            <button
              id="tab-btn-checkout"
              onClick={() => setActiveTab("checkout")}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider ${
                activeTab === "checkout"
                  ? "bg-[#0046be] text-white"
                  : "text-[#4B5563] hover:bg-[#F3F4F6]"
              }`}
              disabled={cartItems.length === 0}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Checkout Pay</span>
            </button>
          </div>

          <div className="flex items-center gap-1">
            <Award className="w-4 h-4 text-[#f5a623]" />
            <span className="text-[11px] font-mono font-semibold text-[#4B5563] uppercase tracking-widest">
              LKR Standard Currency
            </span>
          </div>
        </div>

        {/* Tab Contents Viewport */}
        <div className="flex-1 overflow-hidden relative">
          
          {/* CATALOG / SEARCH RESULTS */}
          {activeTab === "catalog" && (
            <ProductDisplay
              products={products}
              onAddToCart={handleAddToCart}
              cartItems={cartItems}
            />
          )}

          {/* SHOPPING CART PAGE */}
          {activeTab === "cart" && (
            <div className="h-full flex flex-col p-6 overflow-y-auto" id="cart-viewport">
              <div className="max-w-2xl mx-auto w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-sm flex flex-col overflow-hidden">
                <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-linear-to-b from-gray-50/50 to-white">
                  <div>
                    <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-[#0046be]" />
                      Localized Persisted Shopping Cart
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">Your items remain synced across turn completions</p>
                  </div>
                  {cartItems.length > 0 && (
                    <button
                      id="btn-clear-cart"
                      onClick={handleClearCart}
                      className="text-xs text-gray-400 hover:text-red-500 flex items-center gap-1 cursor-pointer font-medium"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Clear Cart
                    </button>
                  )}
                </div>

                {cartItems.length === 0 ? (
                  <div className="p-16 text-center">
                    <div className="w-12 h-12 bg-blue-50 text-[#0046be] rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <ShoppingCart className="w-6 h-6" />
                    </div>
                    <h4 className="text-base font-semibold text-gray-950">Your Cart is Empty</h4>
                    <p className="text-sm text-gray-500 mt-1.5 max-w-sm mx-auto">
                      Search for cakes or flowers, and click "Add to Cart" to see them active in your local inventory drawer here.
                    </p>
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100 flex-1 max-h-[420px] overflow-y-auto">
                    {cartItems.map((item) => (
                      <div key={item.product.id} className="p-4 flex gap-4 items-center" id={`cart-item-${item.product.id}`}>
                        <img
                          src={item.product.imageUrl}
                          alt={item.product.title}
                          className="w-14 h-14 rounded-xl object-cover border border-gray-100 shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-semibold text-gray-900 truncate">
                            {item.product.title}
                          </h4>
                          <p className="text-xs text-[#0046be] font-mono font-bold mt-1">
                            {item.product.price}
                          </p>
                        </div>

                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1.5 bg-gray-50 p-1 border border-gray-100 rounded-xl shrink-0">
                          <button
                            id={`btn-cart-dec-${item.product.id}`}
                            onClick={() => handleUpdateQty(item.product.id, -1)}
                            className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-100 text-gray-700 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-bold font-mono px-2 min-w-[20px] text-center">
                            {item.quantity}
                          </span>
                          <button
                            id={`btn-cart-inc-${item.product.id}`}
                            onClick={() => handleUpdateQty(item.product.id, 1)}
                            className="w-7 h-7 bg-white hover:bg-gray-100 border border-gray-100 text-gray-700 rounded-lg flex items-center justify-center cursor-pointer active:scale-95 transition-all"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Delete Button */}
                        <button
                          id={`btn-cart-del-${item.product.id}`}
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-gray-400 hover:text-red-500 p-2 rounded-lg cursor-pointer transition-colors shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {cartItems.length > 0 && (
                  <div className="p-5 bg-gray-50 border-t border-gray-100 mt-auto shrink-0">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Subtotal (LKR)</span>
                      <span className="text-lg font-bold text-[#0046be] font-sans">
                        Rs. {getSubtotal().toLocaleString()}
                      </span>
                    </div>

                    <button
                      id="btn-proceed-delivery"
                      onClick={() => setCurrentStep("details")}
                      className="w-full py-3 bg-[#f5a623] hover:bg-[#e49516] text-white rounded-lg text-xs font-bold shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer uppercase tracking-wider"
                    >
                      <span>Proceed to Delivery Info</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* DELIVERY INFO DETAILS FORM */}
          {activeTab === "delivery" && (
            <div className="h-full p-6 overflow-y-auto" id="delivery-viewport">
              <div className="max-w-2xl mx-auto w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 bg-linear-to-b from-gray-50/50 to-white">
                  <h3 className="text-lg font-bold text-gray-950 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#0046be]" />
                    Delivery Destination Credentials
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">Please specify recipient and transport dates below.</p>
                </div>

                <form onSubmit={handleCheckoutSubmit} className="p-6 space-y-4" id="delivery-details-form">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                        Customer Resolute Name *
                      </label>
                      <input
                        id="form-customer-name"
                        type="text"
                        required
                        placeholder="Kapila Perera"
                        className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] text-sm focus:border-[#0046be] focus:ring-2 focus:ring-blue-100 transition-all text-gray-900"
                        value={delivery.customerName}
                        onChange={(e) => setDelivery(prev => ({ ...prev, customerName: e.target.value }))}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                        Contact Mobile Phone *
                      </label>
                      <input
                        id="form-customer-phone"
                        type="tel"
                        required
                        placeholder="+94 77 123 4567"
                        className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] text-sm focus:border-[#0046be] focus:ring-2 focus:ring-blue-100 transition-all text-gray-900"
                        value={delivery.customerPhone}
                        onChange={(e) => setDelivery(prev => ({ ...prev, customerPhone: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                      Target Target Transport Date *
                    </label>
                    <input
                      id="form-delivery-date"
                      type="date"
                      required
                      className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] text-sm focus:border-[#0046be] focus:ring-2 focus:ring-blue-100 transition-all text-gray-900"
                      value={delivery.deliveryDate}
                      onChange={(e) => setDelivery(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                      Full Sri Lankan Street Address *
                    </label>
                    <textarea
                      id="form-delivery-address"
                      required
                      rows={3}
                      placeholder="123 Galle Road, Bambalapitiya, Colombo 03, Sri Lanka"
                      className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] text-sm focus:border-[#0046be] focus:ring-2 focus:ring-blue-100 transition-all text-gray-900 leading-relaxed"
                      value={delivery.deliveryAddress}
                      onChange={(e) => setDelivery(prev => ({ ...prev, deliveryAddress: e.target.value }))}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#4B5563] uppercase tracking-wider mb-1.5">
                      Custom Cake Messaging / Card Instructions
                    </label>
                    <textarea
                      id="form-special-instructions"
                      rows={2}
                      placeholder="Write 'Happy 50th Anniversary Mom and Dad!' with white icing on cake please."
                      className="w-full px-4 py-2.5 rounded-lg border border-[#D1D5DB] text-sm focus:border-[#0046be] focus:ring-2 focus:ring-blue-100 transition-all text-gray-900 leading-relaxed"
                      value={delivery.specialInstructions}
                      onChange={(e) => setDelivery(prev => ({ ...prev, specialInstructions: e.target.value }))}
                    />
                  </div>

                  <div className="pt-4 border-t border-gray-50 flex items-center justify-between">
                    <span className="text-[11px] text-gray-400 font-mono">
                      * All fields are strictly validated before locking checkout.
                    </span>

                    <button
                      id="btn-submit-delivery"
                      type="submit"
                      disabled={hasFormErrors()}
                      className={`px-6 py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                        !hasFormErrors()
                          ? "bg-[#f5a623] hover:bg-[#e49516] text-white shadow-xs"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      Confirm and Complete Invoice
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* CHECKOUT BILLING & PAY LINK PANEL */}
          {activeTab === "checkout" && (
            <div className="h-full p-6 overflow-y-auto" id="checkout-viewport">
              <div className="max-w-xl mx-auto w-full bg-white rounded-2xl border border-[#E5E7EB] shadow-md overflow-hidden relative">
                
                {/* Visual Stamp */}
                <div className="absolute top-4 right-4 bg-blue-50 text-[#0046be] border border-[#a3c1ff] px-3 py-1 pb-1.5 rounded-full text-[10px] font-bold font-mono uppercase tracking-widest flex items-center gap-1">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  Verified Netlify Order
                </div>

                <div className="p-6 border-b border-gray-100 bg-linear-to-b from-gray-50/20 to-white text-center">
                  <span className="text-xs font-bold text-[#f5a623] uppercase tracking-wider font-mono">
                    Online Billing invoice
                  </span>
                  <h3 className="text-xl font-bold text-gray-950 mt-1">Kapruka Secure Pay Gate</h3>
                  <p className="text-xs text-gray-500 mt-1">Ref ID: KAP-AI-{Math.floor(Math.random() * 800000) + 100000}</p>
                </div>

                <div className="p-6 space-y-6">
                  {/* Shipping summary */}
                  <div className="bg-[#F3F4F6] p-4 rounded-xl border border-[#E5E7EB] text-xs space-y-2.5">
                    <h4 className="font-bold text-[#111827] uppercase tracking-wider text-[10px] mb-2.5 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#0046be]" />
                      Recipient Dispatch Credentials
                    </h4>
                    <div>
                      <span className="text-gray-400 font-medium">Recipient Name:</span>{" "}
                      <span className="font-bold text-gray-950 text-right">{delivery.customerName || "Kapila Perera"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Mobile Phone:</span>{" "}
                      <span className="font-bold text-gray-950 font-mono">{delivery.customerPhone || "+94 77 123 4567"}</span>
                    </div>
                    <div>
                      <span className="text-gray-400 font-medium">Dispatched Date:</span>{" "}
                      <span className="font-bold text-gray-950 font-mono">{delivery.deliveryDate || "Target Date"}</span>
                    </div>
                    <div className="border-t border-gray-200 pt-2 shrink-0">
                      <span className="text-gray-400 block mb-0.5 font-medium">Address:</span>{" "}
                      <span className="font-normal text-gray-900 leading-relaxed block text-justify">
                        {delivery.deliveryAddress}
                      </span>
                    </div>
                    {delivery.specialInstructions && (
                      <div className="border-t border-gray-200 pt-2 mt-2 shrink-0 bg-white p-2 rounded-lg">
                        <span className="text-[#0046be] font-bold block mb-0.5">Cake Ice text:</span>{" "}
                        <span className="text-gray-800 italic block">{delivery.specialInstructions}</span>
                      </div>
                    )}
                  </div>

                  {/* Summary items list */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-500 uppercase tracking-widest text-[10px] pb-1.5 border-b border-[#E5E7EB]">
                      Purchased Items Grid
                    </h4>
                    {cartItems.map((item) => (
                      <div key={item.product.id} className="flex justify-between items-center text-xs">
                        <span className="text-gray-800 line-clamp-1 max-w-[70%] font-medium">
                          {item.product.title} <span className="text-[#4B5563] font-mono ml-1">x{item.quantity}</span>
                        </span>
                        <span className="font-bold text-[#0046be] font-sans">
                          {item.product.price}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Netlify active checkout pay block */}
                  {checkoutPayLink && (
                    <div className="bg-blue-50/30 p-5 rounded-lg border border-[#a3c1ff] text-center space-y-4">
                      <div className="flex items-center justify-center gap-2 text-[#0046be]">
                        <CreditCard className="w-5 h-5 text-[#f5a623]" />
                        <span className="text-sm font-bold uppercase tracking-wider">Gate checkout Ready</span>
                      </div>
                      
                      <div className="p-3 bg-white rounded-lg border border-[#E5E7EB] break-all text-xs font-mono select-all flex items-center justify-between text-left">
                        <span className="truncate pr-4 text-[#0046be] font-semibold">{checkoutPayLink}</span>
                        <ExternalLink className="w-4 h-4 text-[#0046be] shrink-0" />
                      </div>

                      <a
                        id="secure-pay-anchor-link"
                        href={checkoutPayLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex w-full py-3.5 bg-[#f5a623] hover:bg-[#e49516] text-white rounded-md text-sm font-bold shadow-md items-center justify-center gap-2 cursor-pointer uppercase tracking-wider hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
                      >
                        <span>Complete Secure Checkout Payment</span>
                        <ArrowRight className="w-4.5 h-4.5 stroke-[2.5]" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
