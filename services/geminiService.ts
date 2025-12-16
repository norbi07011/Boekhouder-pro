import { GoogleGenAI } from "@google/genai";
import { Language } from '../types';

const getClient = () => {
  const apiKey = process.env.API_KEY || ''; 
  // Note: In a real app, ensure API_KEY is set. For this demo, if missing, we'll handle gracefully.
  return new GoogleGenAI({ apiKey });
};

export const getAccountingAdvice = async (query: string, lang: Language): Promise<string> => {
  try {
    const ai = getClient();
    if (!process.env.API_KEY) {
      if (lang === 'PL') return "Klucz API nie został skonfigurowany. Proszę ustawić zmienną środowiskową API_KEY.";
      if (lang === 'TR') return "API anahtarı yapılandırılmadı. Lütfen API_KEY ortam değişkenini ayarlayın.";
      return "API-sleutel is niet geconfigureerd. Stel de omgevingsvariabele API_KEY in.";
    }

    const sysInstruction = `
      You are an expert accountant specializing in the Dutch market (Netherlands).
      You are helpful, precise, and professional.
      You speak fluent Polish, Turkish, and Dutch.
      The user is asking a question in ${lang === 'PL' ? 'Polish' : lang === 'TR' ? 'Turkish' : 'Dutch'}.
      Answer in ${lang === 'PL' ? 'Polish' : lang === 'TR' ? 'Turkish' : 'Dutch'}.
      Focus on Dutch tax laws (Belastingdienst), BTW (VAT), IB (Income Tax), Loonheffingen, and general accounting practices in the Netherlands.
      Keep answers concise and actionable for a professional accountant.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: query,
      config: {
        systemInstruction: sysInstruction,
      }
    });

    return response.text || (lang === 'PL' ? "Nie udało się uzyskać odpowiedzi." : lang === 'TR' ? "Cevap alınamadı." : "Geen antwoord ontvangen.");
  } catch (error) {
    console.error("Gemini Error:", error);
    if (lang === 'PL') return "Przepraszam, wystąpił błąd podczas łączenia z asystentem AI.";
    if (lang === 'TR') return "Üzgünüm, AI asistanına bağlanırken bir hata oluştu.";
    return "Sorry, er is een fout opgetreden bij het verbinden met de AI-assistent.";
  }
};

export const suggestTaskPriority = async (taskTitle: string, taskDesc: string): Promise<'Low' | 'Medium' | 'High'> => {
  try {
      if (!process.env.API_KEY) return 'Medium';
      const ai = getClient();
      const prompt = `Analyze this accounting task for the Dutch market. Title: "${taskTitle}", Description: "${taskDesc}". 
      Return ONLY one word: "Low", "Medium", or "High" based on urgency and typical tax deadlines.`;
      
      const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
      });
      
      const text = response.text?.trim();
      if (text === 'Low' || text === 'Medium' || text === 'High') return text;
      return 'Medium';
  } catch (e) {
      return 'Medium';
  }
}