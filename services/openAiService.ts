import { OnboardingQuestion, RelationshipType, User, AiMessage, Message } from '../types';

// --- OpenAI API Configuration ---
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const API_KEY = process.env.OPENAI_API_KEY; // Assumes OPENAI_API_KEY is set in the environment
const MODEL = 'gpt-4.1-nano-2025-04-14';

// --- Hardcoded Fallbacks (Final Safety Net) ---
const fallbackQuestions: Record<RelationshipType, OnboardingQuestion[]> = {
  [RelationshipType.LONG_TERM]: [{ question: "What's your ideal weekend?", options: ["Relaxing at home", "Exploring the outdoors", "Socializing with friends", "Trying new restaurants"] }],
  [RelationshipType.SHORT_TERM]: [{ question: "What's your idea of a perfect date?", options: ["A spontaneous adventure", "A fancy dinner", "A cozy night in", "A fun activity like bowling"] }],
  [RelationshipType.FRIENDSHIP]: [{ question: "What's your favorite way to spend a day off?", options: ["Gaming or watching shows", "Hiking or being active", "Trying a new cafe", "Chilling with a small group"] }],
  [RelationshipType.GYM_BUDDY]: [{ question: "What's your primary fitness goal?", options: ["Build muscle", "Lose weight", "Improve endurance", "Stay active and healthy"] }],
  [RelationshipType.MOVIE_BUDDY]: [{ question: "What's your all-time favorite movie genre?", options: ["Sci-Fi/Fantasy", "Comedy", "Horror/Thriller", "Drama/Indie"] }],
  [RelationshipType.STUDY_BUDDY]: [{ question: "What's your study environment of choice?", options: ["Silent library", "Bustling coffee shop", "Quiet corner at home", "Collaborative study room"] }],
};


/**
 * A robust helper function to call the OpenAI Chat Completions API.
 * It handles JSON mode, error handling, and returns null on failure.
 */
const callOpenAI = async (systemPrompt: string, userPrompt: string, isJsonMode: boolean = false): Promise<string | null> => {
  if (!API_KEY) {
    console.error("OpenAI API key is not set. Cannot make API call.");
    return null;
  }

  const body: any = {
    model: MODEL,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
  };

  if (isJsonMode) {
    body.response_format = { type: "json_object" };
  }

  try {
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error(`OpenAI API error: ${response.statusText}`, errorData);
      return null;
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || null;
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    return null;
  }
};


const getOnboardingQuestions = async (relationshipType: RelationshipType): Promise<OnboardingQuestion[]> => {
    console.warn(`Falling back to OpenAI service for getOnboardingQuestions`);
    const systemPrompt = `You generate onboarding questions for a connection app. Create 5 unique, engaging questions for a user seeking a "${relationshipType}". Each question must have 4 distinct, single-word or short-phrase options. Respond ONLY with a valid JSON object in the format: { "questions": [{"question": "Your question?", "options": ["Option1", "Option2", "Option3", "Option4"]}] }.`;
    const userPrompt = `Relationship Type: ${relationshipType}`;
    
    try {
        const result = await callOpenAI(systemPrompt, userPrompt, true);
        if (result) {
            const parsed = JSON.parse(result);
            if (Array.isArray(parsed.questions)) {
                return parsed.questions;
            }
        }
    } catch(e) {
        console.error("Failed to parse OpenAI response for onboarding questions:", e);
    }
    
    // Final fallback to hardcoded data
    return fallbackQuestions[relationshipType] || [];
};

const analyzeTextForTags = async (text: string): Promise<{ positive: string[], negative: string[] }> => {
    console.warn(`Falling back to OpenAI service for analyzeTextForTags`);
    const systemPrompt = `Analyze user text to find personality traits, hobbies, and interests. Categorize them into 'positive' (likes) and 'negative' (dislikes). Respond ONLY with a valid JSON object in the format: { "positive": ["tag1"], "negative": ["tag2"] }. If a category is empty, use an empty array.`;
    const userPrompt = `User Text: "${text}"`;
    
    try {
        const result = await callOpenAI(systemPrompt, userPrompt, true);
        if (result) {
            const parsed = JSON.parse(result);
            return {
                positive: parsed.positive || [],
                negative: parsed.negative || [],
            };
        }
    } catch (e) {
        console.error("Failed to parse OpenAI response for tags:", e);
    }
    
    // Final fallback
    return { positive: [], negative: [] };
};

const generateMatchExplanation = async (currentUser: User, potentialMatch: User): Promise<{ explanation: string; rating: number; }> => {
    console.warn(`Falling back to OpenAI service for generateMatchExplanation`);
    const systemPrompt = `You are MatchAI, an insightful AI matchmaker. Explain why two users might connect and give a compatibility score from 0-100. Respond ONLY with a valid JSON object: {"rating": <number>, "explanation": "<friendly, detailed explanation using bold markdown for shared interests>"}.`;
    const userPrompt = `User A ( whose name is ${currentUser.name}) (seeing this): Likes: ${currentUser.tags.positive.join(', ')}. Dislikes: ${currentUser.tags.negative.join(', ')}. Goal: ${currentUser.relationshipGoal}.
User B (potential match): Name: ${potentialMatch.name}. Likes: ${potentialMatch.tags.positive.join(', ')}. Dislikes: ${potentialMatch.tags.negative.join(', ')}. Goal: ${potentialMatch.relationshipGoal}.`;

    try {
        const result = await callOpenAI(systemPrompt, userPrompt, true);
        if (result) {
            const parsed = JSON.parse(result);
            const formattedExplanation = (parsed.explanation || "").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            return {
                explanation: formattedExplanation,
                rating: parsed.rating || 50,
            };
        }
    } catch(e) {
        console.error("Failed to parse OpenAI response for match explanation:", e);
    }

    // Final fallback
    const rating = 20 + Math.floor(Math.random() * 50);
    return { explanation: `You and ${potentialMatch.name} seem to have some interesting things in common. It could be fun to chat!`, rating };
}

const generateFollowUpQuestion = async (conversationHistory: AiMessage[]): Promise<string> => {
    console.warn(`Falling back to OpenAI service for generateFollowUpQuestion`);
    const history = conversationHistory.slice(-5).map(m => `${m.sender}: ${m.text}`).join('\n');
    const systemPrompt = "You are MatchAI, a friendly AI helping a user build their profile. Based on the recent conversation, ask a single, engaging, open-ended follow-up question to learn more about them. Keep it brief.";
    const userPrompt = `Recent History:\n${history}\n\nYour new question:`;

    const result = await callOpenAI(systemPrompt, userPrompt);
    return result || "That's interesting! Can you tell me more?";
};

const generateChatResponse = async (currentUser: User, participant: User, messages: Message[]): Promise<string> => {
    console.warn(`Falling back to OpenAI service for generateChatResponse`);
    const history = messages.map(msg => `${msg.senderId === currentUser.id ? currentUser.name : participant.name}: ${msg.text}`).join('\n');
    const systemPrompt = `You are roleplaying as '${participant.name}'. Your traits are: ${participant.tags.positive.join(', ')}. Based on the chat history with '${currentUser.name}', write a short, natural, casual reply. Sound like a real person, not an AI. Do not be overly enthusiastic.`;
    const userPrompt = `Chat History:\n${history}\n\nYour reply as ${participant.name}:`;

    const result = await callOpenAI(systemPrompt, userPrompt);
    let text = result || "Haha, cool.";
    if (text.startsWith(`${participant.name}:`)) {
        text = text.substring(participant.name.length + 1).trim();
    }
    return text;
};


export const openAiService = {
  getOnboardingQuestions,
  analyzeTextForTags,
  generateMatchExplanation,
  generateFollowUpQuestion,
  generateChatResponse,
};
