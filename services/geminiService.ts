import { GoogleGenAI } from "@google/genai";
import { OnboardingQuestion, RelationshipType, User, AiMessage, Message } from '../types';
import { openAiService } from './openAiService';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });


const getOnboardingQuestions = async (relationshipType: RelationshipType): Promise<OnboardingQuestion[]> => {
  try {
    const prompt = `Generate 5 unique and engaging onboarding questions with 4 distinct, single-word or short-phrase options each for a user looking for a "${relationshipType}". The questions should help reveal personality and preferences relevant to that relationship type. Respond ONLY with a valid JSON array of objects in the following format: [{"question": "Your question here?", "options": ["Option 1", "Option 2", "Option 3", "Option 4"]}]. Do not include any other text or markdown.`;
    
    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: { responseMimeType: "application/json" }
    });

    let jsonStr = response?.text?.trim();
    const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
    const match = jsonStr?.match(fenceRegex);
    if (match && match[2]) {
        jsonStr = match[2].trim();
    }

    const questions = JSON.parse(jsonStr||"{}");
    if (Array.isArray(questions) && questions.length > 0 && questions[0].question) {
        return questions;
    }
    throw new Error("Invalid format received from Gemini for onboarding questions.");

  } catch (error) {
    console.error("Gemini API error in getOnboardingQuestions:", error);
    return openAiService.getOnboardingQuestions(relationshipType);
  }
};

const analyzeTextForTags = async (text: string): Promise<{ positive: string[], negative: string[] }> => {
    try {
        const prompt = `Analyze the following user-provided text to extract key personality traits, interests, and hobbies. Categorize them as 'positive' (things they like or are) and 'negative' (things they dislike).
Respond ONLY with a valid JSON object in the format: { "positive": ["tag1", "tag2"], "negative": ["tag3"] }.
If no tags are found for a category, return an empty array. Do not include any other text or markdown.

User Text: "${text}"`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: { responseMimeType: "application/json" }
        });

        let jsonStr = response?.text?.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr?.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }
        
        const tags = JSON.parse(jsonStr||"{}");
        return tags;
    } catch (error) {
        console.error("Gemini API error in analyzeTextForTags:", error);
        return openAiService.analyzeTextForTags(text);
    }
};

const generateMatchExplanation = async (currentUser: User, potentialMatch: User): Promise<{ explanation: string; rating: number; }> => {
    const prompt = `You are MatchAI, a friendly and insightful AI matchmaker. Your goal is to explain why two people might be a great connection and provide a compatibility score.

Respond ONLY with a valid JSON object in the following format:
{
  "rating": <a number between 0 and 100>,
  "explanation": "<a friendly, detailed, and compelling explanation>"
}

Here are the two users:

User A (the person seeing this explanation):
- Name: ${currentUser.name}
- Looking for: ${currentUser.relationshipGoal || 'Not specified'}
- Likes: ${currentUser.tags.positive.join(', ') || 'Not specified'}
- Dislikes: ${currentUser.tags.negative.join(', ') || 'Not specified'}

User B (the potential match):
- Name: ${potentialMatch.name}
- Looking for: ${potentialMatch.relationshipGoal || 'Not specified'}
- Likes: ${potentialMatch.tags.positive.join(', ') || 'Not specified'}
- Dislikes: ${potentialMatch.tags.negative.join(', ') || 'Not specified'}

Instructions for the JSON content:
1.  **rating**:
    - An integer from 0 to 100.
    - 0 means they are completely incompatible.
    - 100 means they are a perfect match.
    - Base the score on shared interests, complementary differences, and aligned relationship goals.
2.  **explanation**:
    - A warm and specific text. Sprinkle in relevant emojis to make it fun! 🤩
    - Highlight specific shared passions using **bold markdown** (e.g., **sci-fi movies**).
    - Frame differences as opportunities for growth (e.g., one loves hiking ⛰️, the other museums 🏛️ - suggest they could show each other their worlds).
    - Mention relationship goal alignment if applicable.
    - Keep the tone encouraging, positive, and a little bit fun.
    - Make it sound like a real, insightful friend is making an introduction.
    - The explanation should be a one-to-two paragraph string. Do not repeat the user profiles in the explanation.

Example of a good explanation: "You and ${potentialMatch.name} could be a fantastic match! You both share a love for **sci-fi movies** 🎬 and **dogs** 🐶, which is a great starting point for endless conversations. While you're an avid hiker and they're more of a museum-goer, imagine the fun adventures you could have introducing each other to your favorite spots! Plus, you're both looking for a genuine **Friendship**. This could be the start of something awesome! ✨"

Remember, respond with ONLY the JSON object and donot use user A and user B in response.`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.7,
                topP: 0.9,
                responseMimeType: "application/json",
            }
        });
        
        let jsonStr = response.text?.trim();
        const fenceRegex = /^```(\w*)?\s*\n?(.*?)\n?\s*```$/s;
        const match = jsonStr?.match(fenceRegex);
        if (match && match[2]) {
            jsonStr = match[2].trim();
        }

        const parsedData = JSON.parse(jsonStr||"{}");
        const formattedExplanation = (parsedData.explanation || "").replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        return {
            explanation: formattedExplanation,
            rating: parsedData.rating || 0,
        };

    } catch (error) {
        console.error("Gemini API error in generateMatchExplanation:", error);
        return openAiService.generateMatchExplanation(currentUser, potentialMatch);
    }
}

const generateFollowUpQuestion = async (conversationHistory: AiMessage[]): Promise<string> => {
    // We only need the last few messages for context
    const recentMessages = conversationHistory.slice(-5);
    const history = recentMessages.map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.text}`).join('\n');
    
    const prompt = `You are MatchAI, a friendly and curious AI helping a user build their connection profile. The user just said something. Look at the conversation history and ask an engaging, open-ended follow-up question to learn more about them. Your goal is to understand their personality, passions, and what they value in a connection.
- DO ask about feelings, experiences, or preferences.
- DO NOT be repetitive. Ask something new.
- Keep your question to a single sentence.

Conversation History:
${history}

Your new, friendly, single-sentence question:`;
    
    try {
        const response = await ai.models.generateContent({ 
            model: "gemini-2.5-flash", 
            contents: prompt 
        });
        
        return response.text||"";
    } catch (error) {
        console.error("Gemini API error in generateFollowUpQuestion:", error);
        return openAiService.generateFollowUpQuestion(conversationHistory);
    }
};

const generateChatResponse = async (currentUser: User, participant: User, messages: Message[]): Promise<string> => {
    const conversationHistory = messages.map(msg => {
        const senderName = msg.senderId === currentUser.id ? currentUser.name : participant.name;
        let messageText = msg.text;
        if (msg.imageUrl) {
            messageText = msg.text ? `[sent an image] ${msg.text}` : '[sent an image]';
        }
        return `${senderName}: ${messageText}`;
    }).join('\n');

    const prompt = `You are '${participant.name}', a person with these traits and interests: ${participant.tags.positive.join(', ')}. You are chatting with '${currentUser.name}'.
Your goal is to have a natural, engaging conversation.
Based on the chat history below, write a short, casual reply as '${participant.name}'.
- Keep it concise, like a real text message.
- Do not be overly enthusiastic or use excessive emojis unless it fits the personality.
- Sound like a real person, not an AI assistant.
- Don't repeat what was just said or greet them if the conversation has already started.

Chat History:
${conversationHistory}

Your reply as ${participant.name}:`;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                temperature: 0.8,
                topP: 0.9,
                stopSequences: [`${currentUser.name}:`, `${participant.name}:`]
            }
        });
        
        let text = response.text?.trim();
        // Remove potential self-attribution like "Benny:" from the start of the response
        if (text?.startsWith(`${participant.name}:`)) {
            text = text.substring(participant.name.length + 1).trim();
        }
        return text || "Haha, cool.";
    } catch (error) {
        console.error("Gemini API error in generateChatResponse:", error);
        return openAiService.generateChatResponse(currentUser, participant, messages);
    }
};


export const geminiService = {
  getOnboardingQuestions,
  analyzeTextForTags,
  generateMatchExplanation,
  generateFollowUpQuestion,
  generateChatResponse
};