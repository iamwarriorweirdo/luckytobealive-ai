
import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { AnimationType, Emotion } from "../types";

// 1. Định nghĩa Tools
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

// Mock Data cho Calendar Tool
const mockCalendarEvents = {
  today: [
    { time: "10:00 AM", title: "Team Brainstorming", location: "Room 303" },
    { time: "02:00 PM", title: "Product Review with Aura", location: "Virtual" },
    { time: "05:00 PM", title: "Gym Session", location: "City Gym" }
  ]
};

interface AgentResponse {
  metadata: { intent: string; emotion_detected: string; memory_updated: boolean };
  action_3d: { animation: AnimationType; expression: string; look_at: string };
  response: { speech_text: string; display_text: string };
  external_commands: any[];
}

export const chatWithAura = async (
  message: string, 
  systemInstruction: string,
  addLog: (type: any, content: string) => void
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  addLog('thought', 'Sending request to Gemini Flash 3...');

  // Bước 1: Gọi model lần đầu
  let response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: message }] },
    config: {
      tools: tools,
      systemInstruction: systemInstruction // System Instruction đã chứa định nghĩa format JSON
    }
  });

  addLog('info', 'Received initial response from model.');

  // Bước 2: Xử lý Function Calling (nếu có)
  const functionCalls = response.functionCalls;
  if (functionCalls && functionCalls.length > 0) {
    const call = functionCalls[0];
    addLog('tool', `Model is calling function: ${call.name}`);
    
    let functionResponse = {};
    if (call.name === 'get_calendar_events') {
      functionResponse = { events: mockCalendarEvents.today };
      addLog('tool', `Executed ${call.name}, returning mock data.`);
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
        systemInstruction: systemInstruction
      }
    });
    addLog('info', 'Received final response after tool execution.');
  }

  // Bước 3: Trích xuất Grounding (Google Search Sources)
  let sources: {title: string, uri: string}[] = [];
  if (response.candidates && response.candidates[0].groundingMetadata?.groundingChunks) {
    response.candidates[0].groundingMetadata.groundingChunks.forEach((chunk: any) => {
      if (chunk.web?.uri && chunk.web?.title) {
        sources.push({ title: chunk.web.title, uri: chunk.web.uri });
      }
    });
    if (sources.length > 0) addLog('info', `Found ${sources.length} grounding sources.`);
  }

  // Bước 4: Parse kết quả cuối cùng theo format V1.0
  try {
    let text = response.text || "";
    // Clean up markdown code blocks if present
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const rawData = JSON.parse(text);
    
    // Map raw JSON to internal structure
    // Handle case where model might skip nested structure slightly or use different casing, 
    // though Prompt is strict.
    const result: AgentResponse = {
      metadata: rawData.metadata || {},
      action_3d: rawData.action_3d || { animation: 'IDLE', expression: 'NEUTRAL' },
      response: rawData.response || { display_text: rawData.text || text, speech_text: rawData.text || text },
      external_commands: rawData.external_commands || []
    };
    
    // Map Expression string to Emotion Enum
    let mappedEmotion = Emotion.Neutral;
    const expr = result.action_3d.expression?.toUpperCase();
    if (expr === 'SMILING') mappedEmotion = Emotion.Smiling;
    else if (expr === 'SURPRISED') mappedEmotion = Emotion.Surprised;
    else if (expr === 'CONCENTRATED') mappedEmotion = Emotion.Concentrated;
    else if (expr === 'EMPATHETIC') mappedEmotion = Emotion.Empathetic;
    else if (expr === 'HAPPY') mappedEmotion = Emotion.Happy;
    else if (expr === 'THINKING') mappedEmotion = Emotion.Thinking;

    return { 
      text: result.response.display_text,
      speech_text: result.response.speech_text,
      animation: result.action_3d.animation || 'IDLE', 
      emotion: mappedEmotion,
      sources 
    };

  } catch (e) {
    addLog('error', 'Failed to parse JSON response. Fallback to raw text.');
    return { 
      text: response.text || "Xin lỗi, tôi gặp chút trục trặc khi xử lý dữ liệu.", 
      animation: "IDLE", 
      emotion: "concerned",
      sources 
    };
  }
};

// ... keep existing audio functions ...
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

export async function decodeAudioData(data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
  }
  return buffer;
}
