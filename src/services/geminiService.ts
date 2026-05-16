import { GoogleGenAI, Type } from "@google/genai";
import { Skill, SKILL_ICONS_LIST } from "../constants";

const apiKey = process.env.GEMINI_API_KEY;

let genAI: GoogleGenAI | null = null;

export function getGemini() {
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not defined");
  }
  if (!genAI) {
    genAI = new GoogleGenAI({ apiKey });
  }
  return genAI;
}

export interface MatchResult {
  reason: string;
  compatibilityScore: number; // 0 to 100
  suggestedProject: string;
}

export async function findSkillMatches(
  userA: { skillsOffered: Skill[]; skillsWanted: Skill[] },
  userB: { skillsOffered: Skill[]; skillsWanted: Skill[] }
): Promise<MatchResult | null> {
  const ai = getGemini();
  
  const skillStr = (skills: Skill[]) => skills.map(s => `${s.name} (${s.category}${s.description ? ': ' + s.description : ''})`).join(", ");

  const prompt = `
    Analyze these two users for a skill-barter platform.
    User A offers: ${skillStr(userA.skillsOffered)} and wants: ${skillStr(userA.skillsWanted)}.
    User B offers: ${skillStr(userB.skillsOffered)} and wants: ${skillStr(userB.skillsWanted)}.
    
    Determine if they can help each other. 
    Explain why and give a compatibility score (0-100).
    Also suggest a collaborative project they could do together.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reason: { type: Type.STRING },
            compatibilityScore: { type: Type.NUMBER },
            suggestedProject: { type: Type.STRING },
          },
          required: ["reason", "compatibilityScore", "suggestedProject"],
        },
      },
    });

    const result = JSON.parse(response.text || "{}");
    return result as MatchResult;
  } catch (error) {
    console.error("Gemini matching failed:", error);
    return null;
  }
}

export async function translateText(text: string, targetLanguage: string): Promise<string> {
  const ai = getGemini();
  const prompt = `Translate the following text to ${targetLanguage}. Return ONLY the translated text without any explanations or extra characters. Text: "${text}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || text;
  } catch (error) {
    console.error("Translation failed:", error);
    return text;
  }
}

export async function generateBio(skills: Skill[]): Promise<string> {
  const ai = getGemini();
  const prompt = `أنت مساعد مهني خبير. بناءً على هذه المهارات: ${skills.map(s => s.name).join("، ")}، اكتب نبذة شخصية (Bio) جذابة واحترافية باللغة العربية لشخص يشارك في منصة مقايضة مهارات. يجب أن تكون النبذة قصيرة (لا تزيد عن 30 كلمة) وتركز على القيمة التي يقدمها الشخص. أجب بالنص فقط.`;
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Bio generation failed:", error);
    return "";
  }
}

export async function generateSkillDescription(skillName: string, category: string): Promise<string> {
  const ai = getGemini();
  const prompt = `أنت مساعد تقني. صف بإيجاز (باللغة العربية) ما يمكن تقديمه في مهارة "${skillName}" التي تندرج تحت تصنيف "${category}" في سياق مقايضة الخدمات المهنية. اجعل الوصف مفيداً وجذاباً ولا يتعدى 20 كلمة. أجب بالنص فقط.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "";
  } catch (error) {
    console.error("Skill description generation failed:", error);
    return "";
  }
}

export async function suggestRelatedSkills(
  offered: Skill[],
  wanted: Skill[]
): Promise<Skill[]> {
  const ai = getGemini();
  const offeredStr = offered.map(s => s.name).join("، ");
  const wantedStr = wanted.map(s => s.name).join("، ");

  const prompt = `
    أنت مستشار مهني خبير في منصة مقايضة مهارات.
    المستخدم يقدم: ${offeredStr}
    المستخدم يبحث عن: ${wantedStr}
    
    اقترح 4 مهارات إضافية (مهارتين يمكنه تقديمها بناءً على خبرته، ومهارتين قد يحتاجها لتكملة مشاريعه).
    أجب بتنسيق JSON كمصفوفة من الكائنات تحتوي على:
    - name: اسم المهارة بالعربية
    - category: التصنيف المناسب (تطوير، تصميم، تسويق، كتابة، أعمال، تدريب، أخرى)
    - description: وصف مشوق للمهارة بالعربية
    - icon: اختر الأنسب من هذه القائمة فقط: ${SKILL_ICONS_LIST.join(", ")}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              icon: { type: Type.STRING },
            },
            required: ["name", "category", "description", "icon"],
          },
        },
      },
    });

    return JSON.parse(response.text || "[]") as Skill[];
  } catch (error) {
    console.error("Skill suggestions failed:", error);
    return [];
  }
}

export async function searchSkillsAI(keyword: string): Promise<Skill[]> {
  const ai = getGemini();
  const prompt = `
    أنت محرك بحث ذكي متخصص في مهارات مقايضة الخدمات. 
    المستخدم يبحث عن مهارات متعلقة بـ: "${keyword}".
    
    قم باقتراح 5 مهارات دقيقة، احترافية، وعالية الصلة بهذا البحث باللغة العربية.
    يجب أن يتضمن الاقتراح تصنيفاً مناسباً ووصفاً مختصراً وجذاباً لكل مهارة.

    أجب بتنسيق JSON كمصفوفة من الكائنات تحتوي على:
    - name: اسم المهارة بالعربية
    - category: التصنيف المناسب (تطوير، تصميم، تسويق، كتابة، أعمال، تعليم، تدريب، فني، أخرى)
    - description: وصف قصير ومركز للمهارة (بحد أقصى 15 كلمة)
    - icon: اختر الأنسب من هذه القائمة فقط: ${SKILL_ICONS_LIST.join(", ")}
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              icon: { type: Type.STRING },
            },
            required: ["name", "category", "description", "icon"],
          },
        },
      },
    });

    const result = JSON.parse(response.text || "[]");
    return result as Skill[];
  } catch (error) {
    console.error("AI Skill search failed:", error);
    return [];
  }
}

export async function suggestSkillIcon(skillName: string, category: string): Promise<string> {
  const ai = getGemini();
  const prompt = `
    بناءً على المهارة "${skillName}" في تصنيف "${category}"، اختر الأيقونة الأكثر ملاءمة من القائمة التالية فقط:
    ${SKILL_ICONS_LIST.join(", ")}
    أجب باسم الأيقونة فقط دون أي شرح.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    const result = response.text?.trim() || "";
    return SKILL_ICONS_LIST.includes(result) ? result : "Sparkles";
  } catch (error) {
    console.error("Icon suggestion failed:", error);
    return "Sparkles";
  }
}
