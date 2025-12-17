
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Feedback, VocabularyPracticeTarget, PronunciationFeedback } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateParagraph = async (topic: string, previousParagraph?: string): Promise<string> => {
  try {
    const prompt = `
      Generate a short, simple Thai paragraph for a beginner/intermediate language learner.
      The paragraph should be 2 to 4 sentences long.
      The topic is "${topic}".
      The paragraph should be about a common and practical situation.
      ${previousParagraph ? `It must be different from the previous paragraph which was: "${previousParagraph}".` : ''}
      Ensure the generated paragraph is unique for this session.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            paragraph: {
              type: Type.STRING,
              description: "The generated Thai paragraph."
            },
          },
          required: ["paragraph"],
        },
      },
    });

    const jsonString = response.text;
    const result = JSON.parse(jsonString);
    return result.paragraph;
  } catch (error) {
    console.error("Error generating paragraph:", error);
    throw new Error("Could not generate a paragraph from the AI.");
  }
};

export const checkTranslation = async (thaiParagraph: string, userTranslation: string): Promise<Feedback> => {
  try {
    const prompt = `
      You are a helpful Thai language tutor. A student is practicing their reading.
      Original Thai paragraph: "${thaiParagraph}"
      Student's English translation: "${userTranslation}"

      Analyze the student's translation.
      1. Determine if the translation is correct. It's correct if the main meaning is captured, even with slightly different wording.
      2. Provide a brief, encouraging feedback explaining your reasoning.
      3. If the student's translation is not perfect, provide the ideal English translation. If it is perfect, you can repeat their translation or offer a slight variation.
      4. Extract a list of 3-5 key vocabulary words from the Thai paragraph. For each word, provide the original Thai word and its English translation.

      Return the response in JSON format.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isCorrect: {
              type: Type.BOOLEAN,
              description: "True if the meaning is perfectly or very closely captured."
            },
            feedback: {
              type: Type.STRING,
              description: "Your explanation and feedback for the student."
            },
            correctTranslation: {
              type: Type.STRING,
              description: "The ideal English translation."
            },
            vocabulary: {
              type: Type.ARRAY,
              description: "A list of key vocabulary words from the paragraph.",
              items: {
                type: Type.OBJECT,
                properties: {
                  thai: {
                    type: Type.STRING,
                    description: "The vocabulary word in Thai."
                  },
                  english: {
                    type: Type.STRING,
                    description: "The English translation of the word."
                  }
                },
                required: ["thai", "english"]
              }
            }
          },
          required: ["isCorrect", "feedback", "correctTranslation", "vocabulary"],
        },
      },
    });

    const jsonString = response.text;
    const result: Feedback = JSON.parse(jsonString);
    return result;
  } catch (error) {
    console.error("Error checking translation:", error);
    throw new Error("Could not get feedback from the AI.");
  }
};

export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      throw new Error("No audio data returned from API.");
    }
    return base64Audio;
  } catch (error) {
    console.error("Error generating speech:", error);
    throw new Error("Could not generate audio from the AI.");
  }
};

export const generatePracticeWord = async (topic: string, previousWord?: string): Promise<VocabularyPracticeTarget> => {
  try {
    const prompt = `
      Generate a single Thai word or short phrase related to the topic "${topic}" for pronunciation practice.
      The word should be suitable for a beginner/intermediate learner.
      ${previousWord ? `It must be different from the previous word which was: "${previousWord}".` : ''}
      Return JSON with the Thai word, a phonetic guide (transliteration), and the English meaning.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            thai: { type: Type.STRING, description: "The Thai word or phrase" },
            phonetic: { type: Type.STRING, description: "Phonetic transliteration (e.g., 'Sawasdee')" },
            english: { type: Type.STRING, description: "English meaning" }
          },
          required: ["thai", "phonetic", "english"]
        }
      }
    });

    const jsonString = response.text;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error generating practice word:", error);
    throw new Error("Could not generate a practice word.");
  }
};

export const evaluatePronunciation = async (targetWord: string, audioBase64: string, mimeType: string): Promise<PronunciationFeedback> => {
  try {
    const prompt = `
      You are a strict but helpful Thai language teacher. 
      The student is trying to pronounce the word/phrase: "${targetWord}".
      Listen to the audio and evaluate their pronunciation.
      
      Provide:
      1. A score from 1 to 100 based on accuracy, tone, and clarity.
      2. A brief feedback explaining what was good or what needs improvement (especially tones).
      3. A specific tip for improvement.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: audioBase64
            }
          },
          {
            text: prompt
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: "Score from 1 to 100" },
            feedback: { type: Type.STRING, description: "General feedback on pronunciation" },
            tips: { type: Type.STRING, description: "Specific tip to improve" }
          },
          required: ["score", "feedback", "tips"]
        }
      }
    });

    const jsonString = response.text;
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error evaluating pronunciation:", error);
    throw new Error("Could not evaluate pronunciation.");
  }
};
