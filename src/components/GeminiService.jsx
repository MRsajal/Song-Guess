// Gemini API Service
class GeminiService {
  static async generateEmojis(songTitle) {
    const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

    if (!API_KEY) {
      throw new Error(
        "Gemini API key not found. Please add VITE_GEMINI_API_KEY to your .env file"
      );
    }

    const prompt = `Generate 3-6 emojis that represent the song "${songTitle}". The emojis should be creative and help people guess the song title. Only return the emojis, no text or explanation. For example, for "Shape of You" by Ed Sheeran, you might return: 🔷👤💘🎵`;

    // Try different model names in case one is deprecated
    const modelNames = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
    
    for (const modelName of modelNames) {
      try {
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${API_KEY}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: prompt,
                    },
                  ],
                },
              ],
            }),
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Gemini API Error with ${modelName}: ${response.status} - ${errorText}`);
          
          // If it's a 404, try the next model
          if (response.status === 404) {
            continue;
          }
          
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        
        // Check if the response has the expected structure
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
          console.warn("Unexpected API response structure:", data);
          return "🎵🎶🎤✨";
        }
        
        const generatedText =
          data.candidates[0]?.content?.parts[0]?.text || "🎵🎶🎤✨";

        // Clean up the response to only include emojis
        // Comprehensive emoji regex that covers all major emoji ranges
        const emojiRegex = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA70}-\u{1FAFF}]|[\u{1F004}]|[\u{1F0CF}]|[\u{1F170}-\u{1F251}]/gu;
        const emojis = generatedText.match(emojiRegex);

        return emojis ? emojis.join("") : "🎵🎶🎤✨";
        
      } catch (error) {
        console.error(`Error with model ${modelName}:`, error);
        
        // If this was the last model to try, throw the error
        if (modelName === modelNames[modelNames.length - 1]) {
          console.error("All models failed. Returning fallback emojis.");
          return "🎵🎶🎤✨";
        }
        
        // Otherwise, continue to try the next model
        continue;
      }
    }
    
    // Fallback if all models fail
    return "🎵🎶🎤✨";
  }
}

export default GeminiService;
