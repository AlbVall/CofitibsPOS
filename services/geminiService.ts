
import { GoogleGenAI, Type } from "@google/genai";
import { Product, Order } from "../types";

export const getInventoryInsights = async (products: Product[], orders: Order[]) => {
  // Use named parameter for apiKey and fetch from process.env.API_KEY
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  try {
    // Upgrade to gemini-3-pro-preview for complex reasoning and data analysis
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Analyze this coffee shop data for "Bark & Brew":
      Current Inventory: ${JSON.stringify(products.map(p => ({ name: p.name, stock: p.stock, price: p.price })))}
      Recent Sales History: ${JSON.stringify(orders.slice(0, 20).map(o => ({ total: o.total, items: o.items.map(i => i.name) })))}
      
      Identify 3 actionable business insights. Focus on:
      1. Low stock items that are popular.
      2. High margin items that could be promoted.
      3. General shop efficiency or trends.
      
      Return as JSON.`,
      config: {
        // Set thinkingBudget for complex reasoning tasks on Gemini 3 models
        thinkingConfig: { thinkingBudget: 32768 },
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            insights: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  priority: { type: Type.STRING, enum: ['high', 'medium', 'low'] },
                  icon: { type: Type.STRING, description: 'FontAwesome icon class' }
                },
                required: ['title', 'description', 'priority', 'icon']
              }
            }
          },
          required: ['insights']
        }
      }
    });

    // Directly access .text property as per guidelines
    const text = response.text;
    if (!text) return { insights: [] };
    
    return JSON.parse(text.trim());
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return { insights: [] };
  }
};
