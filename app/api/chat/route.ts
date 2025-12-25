import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { SYSTEM_INSTRUCTION } from "@/constants";

// Khởi tạo Gemini Client (Server-side)
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    // Gọi Gemini Model
    // Lưu ý: Ta dùng 'gemini-2.5-flash' hoặc 'gemini-1.5-flash' tùy vào availability, 
    // trong prompt gốc bạn dùng 'gemini-3-flash-preview', hãy đảm bảo model này access được.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', 
      config: {
        responseMimeType: 'application/json', // Bắt buộc trả về JSON
        systemInstruction: SYSTEM_INSTRUCTION
      },
      contents: [{ parts: [{ text: message }] }]
    });

    // Parse JSON từ text trả về của model
    const textResponse = response.text || "{}";
    let jsonResponse;
    
    try {
        jsonResponse = JSON.parse(textResponse);
    } catch (e) {
        // Fallback nếu model trả về JSON lỗi
        jsonResponse = {
            response: { display_text: textResponse, speech_text: textResponse },
            action_3d: { animation: "IDLE", expression: "NEUTRAL" }
        };
    }

    return NextResponse.json(jsonResponse);

  } catch (error: any) {
    console.error("AI Brain Error:", error);
    return NextResponse.json(
      { error: "Brain connection failed", details: error.message }, 
      { status: 500 }
    );
  }
}