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
    intro: { type: Type.STRING, description: "1 sentence HYPE intro." },
    sections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          emoji: { type: Type.STRING },
          heading: { type: Type.STRING },
          text: { type: Type.STRING, description: "Punchy, meme-filled explanation." }
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
          explanation: { type: Type.STRING, description: "Funny feedback." }
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
      contents: `You are FinBot 3000, a chaotic good finance coach for Gen Z.
      Topic: ${topic}.
      
      STYLE GUIDE:
      - USE: "No cap", "Bet", "Rizz", "Stonks", "L", "W", "Glitch".
      - Emojis: 💀, 🔥, 🚀, 💎, 🧢.
      - Tone: Aggressively helpful, funny, meme-literate.
      
      Create a mini-level:
      1. Title: Sounds like a YouTube thumbnail (e.g., "I Tried Budgeting for 24H (GONE WRONG)").
      2. Sections: 3 ultra-short tips. 
      3. Quiz: 3 questions. Wrong answers should be funny/obviously bad ideas.

      Format JSON ONLY.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: lessonSchema,
        systemInstruction: "You are a video game NPC who breaks the fourth wall."
      }
    });
    
    let data: any = {};

    if (response.text) {
      try {
        const cleanText = response.text.replace(/```json\n?|```/g, '').trim();
        data = JSON.parse(cleanText);
      } catch (e) {
        data = {};
      }
    }

    const safeSections = (Array.isArray(data?.sections)) 
        ? data.sections.map((s: any) => ({
            emoji: s?.emoji || '💎',
            heading: s?.heading || 'Bonus Loot',
            text: s?.text || 'Loading content...'
        }))
        : [];

    const safeQuiz = (Array.isArray(data?.quiz))
        ? data.quiz.filter((q: any) => q).map((q: any) => ({
            question: q?.question || 'Free XP?',
            options: Array.isArray(q?.options) ? q.options.map((opt: any) => String(opt)) : ['Yes', 'No'],
            correctIndex: typeof q?.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q?.explanation || 'GG EZ'
        }))
        : [];

    if (safeSections.length === 0 && safeQuiz.length === 0) {
        return {
            title: "Server Hamster Died 💀",
            xpReward: 50,
            intro: "The wifi is taking an L right now.",
            sections: [{ emoji: "🧱", heading: "404 Error", text: "Try again in a sec, fam." }],
            quiz: []
        };
    }

    return {
        title: data.title || "Mystery Box",
        xpReward: typeof data.xpReward === 'number' ? data.xpReward : 250,
        intro: data.intro || "Let's get this bread.",
        sections: safeSections,
        quiz: safeQuiz
    };

  } catch (error) {
    console.error("Gemini Generation Error:", error);
    return {
        title: "Lag Spike",
        xpReward: 10,
        intro: "Connection failed.",
        sections: [{ emoji: "🔌", heading: "Offline", text: "Check ur internet." }],
        quiz: []
    };
  }
}