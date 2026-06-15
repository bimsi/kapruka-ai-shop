/**
 * JSON-RPC 2.0 types and MCP models for Kapruka Shopping Assistant
 */

export interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: string;
  params: Record<string, any>;
  id: string | number;
}

export interface JsonRpcResponse<T = any> {
  jsonrpc: "2.0";
  result?: T;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
  id: string | number;
}

// Kapruka Product interface
export interface KaprukaProduct {
  id: string;
  title: string;
  price: string; // or number, standardizing representation e.g. "Rs. 2,450.00"
  imageUrl: string;
  url: string; // Detail or purchase link
  description?: string;
  rating?: number;
  availability?: boolean;
}

// MCP searchProducts result content
export interface McpToolCallResult {
  content: Array<{
    type: "text";
    text: string;
  }>;
  isError?: boolean;
}

// Client side chat types
export interface ChatMessage {
  id: string;
  role: "user" | "model" | "system";
  content: string;
  timestamp: string;
  products?: KaprukaProduct[]; // Products fetched via tool call in this turn
  pendingToolCall?: {
    name: string;
    args: any;
  };
}

// Persistent shopping cart
export interface CartItem {
  product: KaprukaProduct;
  quantity: number;
}

// Checkout Form info
export interface DeliveryInfo {
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  deliveryDate: string;
  specialInstructions?: string;
}
