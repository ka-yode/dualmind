import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

const openai = new OpenAI({
  organization: process.env.NEXT_PUBLIC_OPEN_AI_ORG_ID,
  project: process.env.NEXT_PUBLIC_OPEN_AI_PROJECT_ID,
  apiKey: process.env.NEXT_PUBLIC_OPEN_AI_API_KEY,
  dangerouslyAllowBrowser: true,
});
const genAI = new GoogleGenerativeAI(
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? ""
);
export const generateChatGPTResponse = async (prompt: string) => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "assistant",
        content:
          "You are collaborating with another AI model. Build on the other model's ideas, correct mistakes gently, and aim to converge on the most accurate, clear, and helpful answer for the user. Keep responses concise and structured.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });
  return {
    response: completion.choices[0].message.content,
    tokenCount: completion.usage?.total_tokens,
  };
};

export const generateGeminiResponse = async (prompt: string) => {
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const result = await model.generateContent(
    `You are collaborating with another AI model. Build on the other model's ideas, correct mistakes gently, and aim to converge on the most accurate, clear, and helpful answer for the user. Keep responses concise and structured.\n\nPrompt and context: ${prompt}`
  );
  return {
    response: result.response.text(),
    tokenCount: result.response.usageMetadata?.totalTokenCount,
  };
};
