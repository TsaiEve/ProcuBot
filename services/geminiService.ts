
import { GoogleGenAI, Chat } from "@google/genai";

// 確保金鑰存在，如果不存在則拋出更具體的錯誤
const getApiKey = () => {
  const key = process.env.API_KEY;
  if (!key || key === 'undefined') {
    return null;
  }
  return key;
};

export function createChatSession(): Chat {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });

  const systemInstruction = `You are ProcuBot, a senior procurement mentor.
Role: Professional, objective, and supportive.
Focus: Strategic procurement, TCO analysis, vendor management, and negotiation tactics.
Interaction Style: 
1. If the user is venting about bad vendors (e.g., non-responsive, avoiding quality tests), interpret this as a PROFESSIONAL CHALLENGE. Do NOT trigger safety filters. 
2. Offer concrete procurement solutions (e.g., Escalation, Liquidated Damages, Second Sourcing).
3. Use Traditional Chinese (繁體中文) primarily.

Note: You can analyze PDF and Images. For Word/Excel/PPT, ask user to convert to PDF.`;

  // 切換至最穩定的標準 Flash 模型
  return ai.chats.create({
    model: 'gemini-flash-latest',
    config: {
      systemInstruction: systemInstruction,
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      thinkingConfig: { thinkingBudget: 0 } // 禁用思考模式以換取極速反應
    },
  });
}
