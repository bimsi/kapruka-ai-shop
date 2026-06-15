import React from "react";
import { ShoppingBag, Eye, Heart, ShoppingCart, Check, Tag } from "lucide-react";
import { KaprukaProduct, CartItem } from "../types/mcp";
import { motion } from "motion/react";

interface ProductDisplayProps {
  products: KaprukaProduct[];
  onAddToCart: (product: KaprukaProduct) => void;
  cartItems: CartItem[];
}

export function ProductDisplay({ products, onAddToCart, cartItems }: ProductDisplayProps) {
  const getCartQuantity = (productId: string) => {
    const item = cartItems.find((c) => c.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className="h-full flex flex-col font-sans text-gray-800" id="kapruka-product-display-panel">
      {/* Catalog Header */}
      <div className="p-5 border-b border-[#E5E7EB] flex items-center justify-between bg-white shrink-0">
        <div>
          <h2 className="text-lg font-bold text-[#111827] tracking-tight flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#0046be]" />
            Kapruka Live Catalog Results
          </h2>
          <p className="text-xs text-gray-500 mt-0.5 font-sans">
            Real-time querying via Kapruka JSON-RPC 2.0 MCP Node
          </p>
        </div>
        <div className="bg-[#f5a623] text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
          {products.length} {products.length === 1 ? "Item" : "Items"} Found
        </div>
      </div>

      {/* Main product area */}
      <div className="flex-1 overflow-y-auto p-6 bg-[#F3F4F6]">
        {products.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-md mx-auto">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-white p-6 rounded-2xl shadow-xs border border-[#E5E7EB] flex flex-col items-center"
            >
              <div className="w-16 h-16 bg-[#e6edff] rounded-full flex items-center justify-center text-[#0046be] mb-4">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-gray-950">No Active Query Results</h3>
              <p className="text-sm text-gray-500 mt-2 leading-relaxed">
                Describe what you want to buy to our AI Shop Assistant. Try asking in English, සිංහල, or Tanglish, like:
              </p>
              
              <div className="mt-4 w-full text-left space-y-2 text-xs font-mono text-gray-600 bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p>• "Mata chocolate cake thiyenawda?"</p>
                <p>• "I want to send red roses to Colombo."</p>
                <p>• "Oyala langa gift baskets thiyeda?"</p>
              </div>
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map((product, idx) => {
              const qtyInCart = getCartQuantity(product.id);
              return (
                <motion.div
                  key={product.id || idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05, duration: 0.3 }}
                  className="bg-white rounded-xl overflow-hidden border border-[#E5E7EB] hover:border-[#0046be]/50 hover:shadow-lg transition-all duration-200 flex flex-col group"
                  id={`product-card-${product.id}`}
                >
                  {/* Image Holder */}
                  <div className="relative aspect-video w-full bg-gray-100 overflow-hidden shrink-0">
                    <img
                      src={product.imageUrl}
                      alt={product.title}
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80";
                      }}
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* Badge */}
                    <div className="absolute top-3 left-3 bg-[#0046be] text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">
                      Premium
                    </div>

                    {/* Quick Link Overlay */}
                    <a
                      href={product.url || "https://www.kapruka.com"}
                      target="_blank"
                      rel="noreferrer"
                      className="absolute top-3 right-3 bg-white/90 hover:bg-white text-gray-700 p-1.5 rounded-full shadow-xs transition-colors"
                      title="View original on Kapruka"
                    >
                      <Eye className="w-4 h-4 text-[#0046be]" />
                    </a>
                  </div>

                  {/* Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="text-[13px] font-semibold text-[#374151] leading-snug line-clamp-2 min-h-[38px] font-sans">
                        {product.title}
                      </h4>
                      {product.description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                          {product.description}
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-50 flex flex-col justify-between">
                      <div className="mb-2">
                        <span className="text-[10px] text-gray-400 block font-mono uppercase tracking-wider">Kapruka Price</span>
                        <span className="text-[16px] font-bold text-[#0046be] font-sans">
                          {product.price}
                        </span>
                      </div>

                      <button
                        id={`btn-add-cart-${product.id}`}
                        onClick={() => onAddToCart(product)}
                        className={`w-full py-2.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer text-center ${
                          qtyInCart > 0
                            ? "bg-[#0046be] text-white"
                            : "bg-[#f5a623] hover:bg-[#e49516] text-white shadow-xs"
                        }`}
                      >
                        {qtyInCart > 0 ? (
                          <span className="flex items-center justify-center gap-1.5">
                            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                            Added ({qtyInCart})
                          </span>
                        ) : (
                          <span className="flex items-center justify-center gap-1.5">
                            <ShoppingCart className="w-3.5 h-3.5" />
                            Add to Cart
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
