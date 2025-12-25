import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { NextResponse } from "next/server";
import { SYSTEM_INSTRUCTION } from "../../../constants";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// 1. Định nghĩa Tools (Giống services/geminiService.ts cũ)
const getCalendarEventsDeclaration: FunctionDeclaration = {
  name: "get_calendar_events",
  description: "Get the user's calendar events for the current day.",
  parameters: {
    type: Type.OBJECT,
    properties: {
      day: { type: Type.STRING, description: "The day to fetch events for (e.g., 'today', 'tomorrow')" }
    }
  }
};

const tools: Tool[] = [
  { googleSearch: {} },
  { functionDeclarations: [getCalendarEventsDeclaration] }
];

// Mock Data
const mockCalendarEvents = {
  today: [
    { time: "10:00 AM", title: "Team Brainstorming", location: "Room 303" },
    { time: "02:00 PM", title: "Product Review with Aura", location: "Virtual" },
    { time: "05:00 PM", title: "Gym Session", location: "City Gym" }
  ]
};

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // Bước 1: Gọi model
    let response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview', // Dùng model mạnh hơn cho text chat
      contents: { parts: [{ text: message }] },
      config: {
        tools: tools,
        systemInstruction: SYSTEM_INSTRUCTION,
        // Lưu ý: Khi dùng Tools/Search, responseMimeType JSON đôi khi gây xung đột định dạng, 
        // ta sẽ parse thủ công để an toàn hơn.
      }
    });

    // Bước 2: Xử lý Function Calling
    const functionCalls = response.functionCalls;
    if (functionCalls && functionCalls.length > 0) {
      const call = functionCalls[0];
      let functionResponse = {};
      
      if (call.name === 'get_calendar_events') {
        functionResponse = { events: mockCalendarEvents.today };
      }

      // Gửi kết quả tool lại cho model
      response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          { role: 'user', parts: [{ text: message }] },
          { role: 'model', parts: call.args ? [{ functionCall: call }] : [] }, 
          { role: 'function', parts: [{ functionResponse: { name: call.name, response: functionResponse } }] }
        ],
        config: {
          tools: tools,
          systemInstruction: SYSTEM_INSTRUCTION
        }
      });
    }

    // Bước 3: Trích xuất Grounding (Nguồn Search)
    let sources: {title: string, uri: string}[] = [];
    if (response.candidates && response.candidates[0].groundingMetadata?.groundingChunks) {
      response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
        if (chunk.web?.uri && chunk.web?.title) {
          sources.push({ title: chunk.web.title, uri: chunk.web.uri });
        }
      });
    }

    // Bước 4: Parse JSON response
    const textResponse = response.text || "{}";
    // Clean markdown code blocks
    const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let jsonResponse;
    try {
        jsonResponse = JSON.parse(cleanJson);
    } catch (e) {
        // Fallback
        jsonResponse = {
            response: { display_text: textResponse, speech_text: textResponse },
            action_3d: { animation: "IDLE", expression: "NEUTRAL" }
        };
    }

    return NextResponse.json({ ...jsonResponse, sources });

  } catch (error: any) {
    console.error("Brain Error:", error);
    return NextResponse.json(
      { error: "Internal Error", details: error.message }, 
      { status: 500 }
    );
  }
}