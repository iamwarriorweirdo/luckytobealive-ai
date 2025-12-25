
import { GoogleGenAI, Type } from "@google/genai";

/**
 * Chat with Aura using the Gemini 3 Flash model.
 * Initializes a new client instance right before calling as per coding guidelines.
 */
export const chatWithAura = async (message: string) => {
  // Always use process.env.API_KEY directly
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts: [{ text: message }] },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "Nội dung phản hồi bằng tiếng Việt." },
          animation: { type: Type.STRING, enum: ["IDLE", "TALK", "WAVE", "THINKING"] },
          emotion: { type: Type.STRING, enum: ["neutral", "happy", "concerned", "excited", "thinking", "calm"] }
        },
        required: ["text", "animation", "emotion"]
      },
      systemInstruction: `Bạn là Aura, trợ lý AI 3D cao cấp của luckytobealive.AI. 
      Hãy trả lời thân thiện, sâu sắc. Luôn trả lời bằng tiếng Việt.
      Chọn hoạt ảnh phù hợp: 
      - WAVE khi chào hỏi.
      - TALK khi giải thích.
      - THINKING khi suy nghĩ sâu.
      - IDLE cho các trạng thái khác.`
    }
  });

  try {
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (e) {
    return { text: response.text || "", animation: "IDLE", emotion: "neutral" };
  }
};

/**
 * Decodes base64 string to Uint8Array.
 */
export function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);
  return bytes;
}

/**
 * Encodes Uint8Array to base64 string.
 */
export function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

/**
 * Manually decodes raw PCM audio data for the Live API.
 * Follows the provided guidelines for handling raw audio bytes from Gemini.
 */
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
