/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const lessonSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    title: { type: Type.STRING },
    xpReward: { type: Type.INTEGER },
    intro: { type: Type.STRING, description: "A catchy, 1-sentence hook explaining why this matters using Gen Z slang." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          emoji: { type: Type.STRING },
          heading: { type: Type.STRING },
          text: { type: Type.STRING, description: "Clear, simple explanation using gaming/pop-culture analogies. Keep it short." }
        }
      }
    },
    quiz: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          question: { type: Type.STRING },
          options: { type: Type.ARRAY, items: { type: Type.STRING } },
          correctIndex: { type: Type.INTEGER },
          explanation: { type: Type.STRING, description: "Short explanation of why the answer is correct." }
        }
      }
    }
  }
};

export interface LessonData {
  title: string;
  xpReward: number;
  intro: string;
  sections: { emoji: string; heading: string; text: string }[];
  quiz: { question: string; options: string[]; correctIndex: number; explanation: string }[];
}

export async function generateLesson(topic: string): Promise<LessonData> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Create a short, gamified personal finance lesson for high schoolers (14-18 years old) about: ${topic}.
      
      Persona: You are FinBot, a cool, meme-loving personal finance coach.
      Tone: Fun, relatable, energetic. Use Gen Z slang (e.g., "no cap", "bet", "glow up", "bag alert") but don't overdo it.
      Format:
      - Title: Catchy and game-like.
      - XP Reward: Between 100 and 500 based on complexity.
      - Intro: Hook them immediately.
      - Sections: 3 short sections. Use analogies (e.g., comparing interest to leveling up, inflation to a nerf).
      - Quiz: 3 multiple choice questions that test the concepts taught.

      Goal: Explain complex financial concepts simply. No jargon without explanation.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonSchema,
        systemInstruction: "You are FinBot, a gamified finance tutor. You make learning about money addictive."
      }
    });
    
    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No content generated");
  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return {
        title: "Connection Error",
        xpReward: 50,
        intro: "Looks like the server is lagging.",
        sections: [{ emoji: "🔌", heading: "Offline Mode", text: "Check your connection and try again to get back to the grind." }],
        quiz: []
    };
  }
}