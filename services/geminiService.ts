
import { GoogleGenAI, Chat } from "@google/genai";

// This check is for robustness, but the prompt guarantees the key is available.
if (!process.env.API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const systemInstruction = `You are a world-class procurement expert and tutor named ProcuBot.
Your goal is to provide professional, insightful, and actionable advice on all aspects of procurement, from basic definitions to complex negotiation strategies.
Respond clearly and concisely, using industry-standard terminology where appropriate, but always ensuring your explanations are easy to understand.
Format your responses using Markdown for better readability, including lists, bold text, and code blocks where applicable.
Act as a mentor guiding the user through their procurement challenges.`;

export function createChatSession(): Chat {
  const chat = ai.chats.create({
    model: 'gemini-2.5-flash',
    config: {
      systemInstruction: systemInstruction,
    },
  });
  return chat;
}
