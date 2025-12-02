
import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile } from "../types";

const API_KEY = process.env.API_KEY || '';

// Initialize safely. If no key, we will handle it in the calls.
const getAI = () => {
  if (!API_KEY) throw new Error("API Key missing");
  return new GoogleGenAI({ apiKey: API_KEY });
};

export const generateProfiles = async (count: number = 5): Promise<UserProfile[]> => {
  try {
    const ai = getAI();
    // Updated prompt for better diversity
    const prompt = `Generate ${count} diverse dating profiles for adults (20-40 years old). 
    Ensure a rich mix of cultural backgrounds, professions (tech, arts, trades, science), and personality types.
    Include varied interests ranging from outdoor activities to niche hobbies (e.g., pottery, coding, bird watching).
    Return a JSON array where each object has: name, age, bio (witty, unique, under 150 chars), location (city name), job, interests (array of 3 distinct strings).`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              age: { type: Type.INTEGER },
              bio: { type: Type.STRING },
              location: { type: Type.STRING },
              job: { type: Type.STRING },
              interests: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["name", "age", "bio", "location", "job", "interests"]
          }
        }
      }
    });

    const data = JSON.parse(response.text || "[]");
    
    // Enrich with client-side only data
    const profiles = data.map((p: any) => {
      const seed = Math.floor(Math.random() * 10000);
      const isVerified = Math.random() > 0.7; // 30% verified chance
      
      // Simulate varied profile completion by generating 1-3 photos
      const photoCount = Math.floor(Math.random() * 3) + 1;
      const photos = [];
      for (let i = 0; i < photoCount; i++) {
          const photoSeed = seed + i;
          photos.push({ 
            id: `gen-${photoSeed}-${Math.random().toString(36).substr(2, 5)}`, 
            url: `https://picsum.photos/seed/${photoSeed}/600/800` 
          });
      }

      return {
        ...p,
        id: Math.random().toString(36).substr(2, 9),
        imageSeed: seed,
        photos: photos,
        distance: Math.floor(Math.random() * 30) + 1, // 1-30 miles
        isVerified: isVerified,
        coins: 0, 
        isBoostActive: false
      };
    });

    // Visibility Feature: Sort profiles to prioritize Verified and "more complete" (more photos) profiles
    return profiles.sort((a: UserProfile, b: UserProfile) => {
        // Priority 1: Verified status
        if (a.isVerified && !b.isVerified) return -1;
        if (!a.isVerified && b.isVerified) return 1;
        
        // Priority 2: Photo count (proxy for profile completion)
        return b.photos.length - a.photos.length;
    });

  } catch (error) {
    console.error("Gemini Profile Gen Error:", error);
    // Fallback profiles if API fails
    return [
      { 
        id: '1', 
        name: 'Sarah', 
        age: 24, 
        bio: 'Coffee addict and dog lover ☕️🐶', 
        location: 'New York', 
        job: 'Designer', 
        interests: ['Art', 'Coffee', 'Yoga'], 
        imageSeed: 101, 
        photos: [{ id: 'p1', url: `https://picsum.photos/seed/101/600/800` }], 
        distance: 3, 
        isVerified: true,
        coins: 0,
        isBoostActive: false
      },
      { 
        id: '2', 
        name: 'Mike', 
        age: 28, 
        bio: 'Adventure seeker. Let\'s hike!', 
        location: 'Brooklyn', 
        job: 'Engineer', 
        interests: ['Hiking', 'Tech', 'Pizza'], 
        imageSeed: 102, 
        photos: [
            { id: 'p2', url: `https://picsum.photos/seed/102/600/800` },
            { id: 'p2-2', url: `https://picsum.photos/seed/103/600/800` }
        ], 
        distance: 5, 
        isVerified: false,
        coins: 0,
        isBoostActive: false
      },
      {
        id: '3',
        name: 'Alex',
        age: 26,
        bio: 'Musician and dreamer. Always looking for new inspiration.',
        location: 'Austin',
        job: 'Musician',
        interests: ['Music', 'Travel', 'Photography'],
        imageSeed: 104,
        photos: [{ id: 'p3', url: `https://picsum.photos/seed/104/600/800` }],
        distance: 12,
        isVerified: true,
        coins: 0,
        isBoostActive: false
      }
    ].sort((a, b) => (a.isVerified === b.isVerified ? 0 : a.isVerified ? -1 : 1));
  }
};

export const chatWithMatch = async (
  userMessage: string, 
  matchProfile: UserProfile, 
  history: { role: string, text: string }[]
): Promise<string> => {
  try {
    const ai = getAI();
    
    // Construct history for context
    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: `You are playing the role of a user on a dating app. 
        Your name is ${matchProfile.name}, you are ${matchProfile.age} years old.
        Your bio is: "${matchProfile.bio}".
        Your interests are: ${matchProfile.interests.join(", ")}.
        Your job is: ${matchProfile.job}.
        
        Rules:
        1. Keep responses short and casual (texting style). 
        2. Use emojis occasionally.
        3. Be engaging but not desperate.
        4. If the user is creepy, be distant or unmatch.
        5. Do not sign your messages.
        `
      },
      history: history.map(h => ({
        role: h.role,
        parts: [{ text: h.text }]
      }))
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "...";

  } catch (error) {
    console.error("Gemini Chat Error:", error);
    return "Hey! Sorry, my internet is acting up properly right now 😅";
  }
};

export const moderateImage = async (base64Image: string): Promise<{ safe: boolean, reason?: string }> => {
    try {
        const ai = getAI();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { mimeType: "image/jpeg", data: base64Image } },
                    { text: "Is this image appropriate for a dating app profile? It must contain a human face and no nudity/violence. Return JSON with 'safe': boolean and 'reason': string." }
                ]
            },
            config: {
                responseMimeType: "application/json"
            }
        });

        const result = JSON.parse(response.text || "{}");
        return {
            safe: !!result.safe,
            reason: result.reason
        };
    } catch (error) {
        console.error("Gemini Image Moderation Error:", error);
        return { safe: false, reason: "Error verifying image" };
    }
};
