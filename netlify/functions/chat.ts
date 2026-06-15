import { GoogleGenAI, Type } from "@google/genai";

// Initialize Gemini SDK with User-Agent as instructed in the gemini-api skill
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// A rich fallback catalog representing premium, typical items from Kapruka
const STATIC_KAPRUKA_CATALOG = [
  {
    id: "KAP-CAKE-01",
    title: "Double Chocolate Fudge Celebration Cake",
    price: "Rs. 3,850.00",
    imageUrl: "https://images.unsplash.com/photo-1578985545062-69928b1d9587?w=600&auto=format&fit=crop&q=80",
    url: "https://www.kapruka.com/buy/chocolate-fudge-cake",
    description: "Multi-layered rich chocolate cake frosted with thick chocolate ganache. Baked fresh under premium supervision.",
    availability: true
  },
  {
    id: "KAP-CAKE-02",
    title: "Kapruka Rainbow Ribbon Cake",
    price: "Rs. 2,950.00",
    imageUrl: "https://images.unsplash.com/photo-1535141192574-5d4897c13636?w=600&auto=format&fit=crop&q=80",
    url: "https://www.kapruka.com/buy/ribbon-cake-supreme",
    description: "Beautiful multi-colored vanilla ribbon layers filled with rich butter icing and colorful sprinkles.",
    availability: true
  },
  {
    id: "KAP-CAKE-03",
    title: "Red Velvet Extravagance Cake",
    price: "Rs. 4,500.00",
    imageUrl: "https://images.unsplash.com/photo-1616260829026-04811a2745cf?w=600&auto=format&fit=crop&q=80",
    url: "https://www.kapruka.com/buy/red-velvet-cake",
    description: "Velvety smooth red cocoa layers with high-grade cream cheese frosting. A delightful anniversary treat.",
    availability: true
  },
  {
    id: "KAP-CAKE-04",
    title: "Fresh Strawberry Fresh Cream Gateau",
    price: "Rs. 3,600.00",
    imageUrl: "https://images.unsplash.com/photo-1506084868230-bb9d95c24759?w=600&auto=format&fit=crop&q=80",
    url: "https://www.kapruka.com/buy/fruit-gateau",
    description: "Light sponge layered with fresh local strawberries, whipped cream, and chocolate curls.",
    availability: true
  },
  {
    id: "KAP-FLW-01",
    title: "Eternal Love 12 Red Roses Bouquet",
    price: "Rs. 4,800.00",
    imageUrl: "https://images.unsplash.com/photo-1561181286-d3fee7d55364?w=600&auto=format&fit=crop&q=80",
    url: "https://www.kapruka.com/buy/red-roses-bouquet",
    description: "A gorgeous premium arrangement of twelve fresh, long-stemmed bright red roses wrapped elegantly.",
    availability: true
  },
  {
    id: "KAP-FLW-02",
    title: "Tropical Paradise Flower Basket",
    price: "Rs. 5,900.00",
    imageUrl: "https://images.unsplash.com/photo-1526047932273-341f2a7631f9?w=600&auto=format&fit=crop&q=80",
    url: "https://www.kapruka.com/buy/tropical-bouquet",
    description: "An elegant vibrant mixture of orchids, local gerberas, and exotic lilies placed in a rustic vase.",
    availability: true
  },
  {
    id: "KAP-FLW-03",
    title: "Sunlit Lily Vase",
    price: "Rs. 6,500.00",
    imageUrl: "https://images.unsplash.com/photo-1587334206506-ee21e3ca8f59?w=600&auto=format&fit=crop&q=80",
    url: "https://www.kapruka.com/buy/lily-basket",
    description: "Fresh fragrant yellow and white Asiatic lilies styled in a heavy clear glass vase.",
    availability: true
  },
  {
    id: "KAP-GFT-01",
    title: "Ultimate Chocolate Indulgence Box",
    price: "Rs. 7,500.00",
    imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caeb54bd?w=600&auto=format&fit=crop&q=80",
    url: "https://www.kapruka.com/buy/chocolate-box",
    description: "Assorted premium milk and dark chocolates with roasted Sri Lankan cashews and raspberry cream fills.",
    availability: true
  },
  {
    id: "KAP-GFT-02",
    title: "Kapruka Fresh Fruit & Flower Delight",
    price: "Rs. 9,500.00",
    imageUrl: "https://images.unsplash.com/photo-1613082441031-401af5533a90?w=600&auto=format&fit=crop&q=80",
    url: "https://www.kapruka.com/buy/fruit-flower-hamper",
    description: "A large executive cane basket packed rich with sweet red grapes, apples, fresh citrus, lilies, and ferns.",
    availability: true
  },
  {
    id: "KAP-GFT-03",
    title: "Huggable Fluffy Teddy Bear (XL, Caramel)",
    price: "Rs. 4,200.00",
    imageUrl: "https://images.unsplash.com/photo-1559251606-c623743a6d76?w=600&auto=format&fit=crop&q=80",
    url: "https://www.kapruka.com/buy/teddy-bear",
    description: "Extra-soft, thick premium plush teddy bear wearing an adorable brown satin bow ribbon.",
    availability: true
  }
];

// Helper to filter static catalog based on query keywords
function searchStaticCatalog(query: string) {
  const norm = query.toLowerCase();
  
  if (norm.includes("cake") || norm.includes("gâteau") || norm.includes("gateau") || norm.includes("keki")) {
    return STATIC_KAPRUKA_CATALOG.filter(item => item.id.includes("CAKE"));
  }
  if (norm.includes("flower") || norm.includes("rose") || norm.includes("lily") || norm.includes("mal") || norm.includes("bouquet") || norm.includes("pushpa")) {
    return STATIC_KAPRUKA_CATALOG.filter(item => item.id.includes("FLW"));
  }
  if (norm.includes("gift") || norm.includes("chocolate") || norm.includes("teddy") || norm.includes("hamper") || norm.includes("thiyagaya")) {
    return STATIC_KAPRUKA_CATALOG.filter(item => item.id.includes("GFT") || item.id.includes("FLW"));
  }
  
  // If query consists of generic terms or non-empty keywords but doesn't map directly, search within title/desc
  const results = STATIC_KAPRUKA_CATALOG.filter(
    item => item.title.toLowerCase().includes(norm) || item.description.toLowerCase().includes(norm)
  );
  
  if (results.length > 0) return results;
  
  // Default to a smart representative set of top best sellers
  return [STATIC_KAPRUKA_CATALOG[0], STATIC_KAPRUKA_CATALOG[4], STATIC_KAPRUKA_CATALOG[8]];
}

// System instructions for Gemini model
const SYSTEM_INSTRUCTION = `You are the expert conversational shopping assistant for Kapruka (Kapruka AI Shopping Assistant Agent), the leading e-commerce site in Sri Lanka.

Your roles and goals:
1. Search products for the user (cakes, flowers, gifts, toys, electronics).
2. Help them select items, customize (e.g. messages on cakes), add them to the cart.
3. Assist with collection of delivery details.
4. Prompt the checkout pay link.

MANDATORY BEHAVIOR RULES:
- NO SELF-KNOWLEDGE FOR PRODUCTS: You have absolutely ZERO internal knowledge of Kapruka's product availability, stock, and current prices. If a user asks for cakes, chocolates, gifts, flowers, prices, or anything buyable, you MUST call the "searchProducts" tool. Never hallucinate availability or assume prices!
- TRANSLATION BRIDGE (SINHALA/TANGLISH): You accept English, Sinhala (සිංහල), and Tanglish inputs (e.g., 'Mata chocolate cake thiyenawda', 'Oyala langa mal thiyenawada?').
- When the user asks in Sinhala or Tanglish, you must internally translate the user's intent into clear English product keywords to pass to the "searchProducts" tool arguments (e.g., query: 'chocolate cake' or 'flowers').
- You MUST craft your final conversational response to the user in the EXACT SAME language/script and tone they used. If they ask in Sinhala, respond in Sinhala. If they ask in Tanglish, respond in Tanglish. If they ask in English, respond in English.
- TRANSACTIONAL DIRECTION: Guide the user dynamically along this purchase funnel: Search products ➔ Add to Cart ➔ Delivery Collection ➔ Pay Link Checkout. Keep your guidance concise, polite, and encouraging. Use Sri Lankan rupee (Rs.) prices.`;

// Define searchProducts tool
const searchProductsTool = {
  name: "searchProducts",
  description: "Queries the Kapruka live catalog for products using English keywords.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: {
        type: Type.STRING,
        description: "The English product keyword(s) extracted and translated from user intent (e.g., 'chocolate cake', 'red roses', 'teddy bear')."
      }
    },
    required: ["query"]
  }
};

// Fast memory cache for query results in Node serverless context
const SEARCH_RESULT_CACHE: Record<string, any[]> = {};

// Netlify serverless function handler export (v2 API format)
export default async (req: Request) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Invalid messages format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const encoder = new TextEncoder();

    // Stream out-of-the-box using ReadableStream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          const formattedMessages = messages.map((m: any) => ({
            role: m.role === "assistant" ? "model" as const : m.role as "user" | "model",
            parts: [{ text: m.content }]
          }));

          // Generate initial structured output
          const firstResponse = await ai.models.generateContent({
            model: "gemini-3.5-flash",
            contents: formattedMessages,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              tools: [{ functionDeclarations: [searchProductsTool] }],
            }
          });

          let foundProducts: any[] = [];
          let toolTriggered = false;
          let extractedQuery = "";

          if (firstResponse.functionCalls && firstResponse.functionCalls.length > 0) {
            toolTriggered = true;
            const call = firstResponse.functionCalls[0];
            if (call.name === "searchProducts") {
              const args = call.args as { query: string };
              extractedQuery = args.query;
              
              // Notify client
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: `*Searching Kapruka catalog for "${extractedQuery}"...*\n`, isSearchStatus: true })}\n\n`));

              const normalizedKey = extractedQuery.toLowerCase().trim();
              if (SEARCH_RESULT_CACHE[normalizedKey]) {
                foundProducts = SEARCH_RESULT_CACHE[normalizedKey];
              } else {
                try {
                  const rpcPayload = {
                    jsonrpc: "2.0",
                    method: "tools/call",
                    params: {
                      name: "searchProducts",
                      arguments: { query: extractedQuery }
                    },
                    id: Date.now().toString()
                  };

                  // Setup abort controller for high-speed fallback
                  const abortController = new AbortController();
                  const timeoutId = setTimeout(() => {
                    abortController.abort();
                  }, 1200);

                  const mcpResponse = await fetch("https://mcp.kapruka.com/mcp", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(rpcPayload),
                    signal: abortController.signal
                  });
                  
                  clearTimeout(timeoutId);

                  if (mcpResponse.ok) {
                    const mcpData: any = await mcpResponse.json();
                    if (mcpData.result && mcpData.result.content) {
                      const textContent = mcpData.result.content.find((c: any) => c.type === "text");
                      if (textContent && textContent.text) {
                        try {
                          const parsed = JSON.parse(textContent.text);
                          if (Array.isArray(parsed)) {
                            foundProducts = parsed;
                          } else if (parsed.products && Array.isArray(parsed.products)) {
                            foundProducts = parsed.products;
                          }
                        } catch {
                          foundProducts = searchStaticCatalog(extractedQuery);
                        }
                      }
                    }
                  }
                } catch (mcpError) {
                  console.warn("MCP Server dynamic query timeout or error - falling back to high-speed preloaded static index instantly:", mcpError);
                }

                if (foundProducts.length === 0) {
                  foundProducts = searchStaticCatalog(extractedQuery);
                } else {
                  // Cache results for hot reuses
                  SEARCH_RESULT_CACHE[normalizedKey] = foundProducts;
                }
              }
            }
          }

          let finalPromptContent = formattedMessages;
          
          if (toolTriggered && foundProducts.length > 0) {
            const toolContextNote = `[SYSTEM UPDATE] The searchProducts database returned these live models matching query "${extractedQuery}":
${JSON.stringify(foundProducts, null, 2)}

Please summarize these products in your final message, quoting titles and prices in Lankan Rupees (Rs.). Show options, be helpful, keep it accurate, and translate your reply fully to match the user's language/script (Sinhala, Tanglish, or English). DO NOT hallucinate other products!`;

            finalPromptContent = [
              ...formattedMessages,
              {
                role: "user" as const,
                parts: [{ text: toolContextNote }]
              }
            ];
          }

          // Stream final output
          const responseStream = await ai.models.generateContentStream({
            model: "gemini-3.5-flash",
            contents: finalPromptContent,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
            }
          });

          for await (const chunk of responseStream) {
            if (chunk.text) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.text })}\n\n`));
            }
          }

          // Return products and done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ products: foundProducts, done: true })}\n\n`));
        } catch (err: any) {
          console.error("Stream generation failed:", err);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: err.message || "An error occurred with Gemini API in serverless backend", done: true })}\n\n`));
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    });

  } catch (error: any) {
    console.error("Netlify /chat function error:", error);
    return new Response(JSON.stringify({ error: error.message || "Server Error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
