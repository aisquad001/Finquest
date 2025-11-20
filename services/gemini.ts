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
    
    let data: any = {};

    if (response.text) {
      try {
        // Handle potential markdown wrapping if the model ignores mimeType
        const cleanText = response.text.replace(/```json\n?|```/g, '').trim();
        data = JSON.parse(cleanText);
      } catch (e) {
        console.error("JSON Parse Error", e);
        // Don't throw here, we will use fallback data below
        data = {};
      }
    }

    // Deep Sanitization to prevent UI crashes
    // We explicitly check isArray to prevent 'map is not a function' errors
    const safeSections = (Array.isArray(data?.sections)) 
        ? data.sections.map((s: any) => ({
            emoji: s?.emoji || '💡',
            heading: s?.heading || 'Topic',
            text: s?.text || 'Loading content...'
        }))
        : [];

    const safeQuiz = (Array.isArray(data?.quiz))
        ? data.quiz.filter((q: any) => q).map((q: any) => ({
            question: q?.question || 'Bonus Question',
            // Ensure options are an array of strings
            options: Array.isArray(q?.options) ? q.options.map((opt: any) => String(opt)) : ['True', 'False'],
            correctIndex: typeof q?.correctIndex === 'number' ? q.correctIndex : 0,
            explanation: q?.explanation || 'Good luck!'
        }))
        : [];

    // If everything failed (e.g. empty JSON), provide a backup lesson so the app doesn't break
    if (safeSections.length === 0 && safeQuiz.length === 0) {
        return {
            title: "The Bank is Closed",
            xpReward: 50,
            intro: "We couldn't generate the lesson right now. Try again later!",
            sections: [{ emoji: "🔒", heading: "System Maintenance", text: "The finance servers are taking a nap." }],
            quiz: []
        };
    }

    // Sanitize and return safe data structure
    return {
        title: data.title || "Bonus Quest",
        xpReward: typeof data.xpReward === 'number' ? data.xpReward : 100,
        intro: data.intro || "Let's get this bread! 🍞",
        sections: safeSections,
        quiz: safeQuiz
    };

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