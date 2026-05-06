import "dotenv/config";

export interface ParsedFilters {
  brand?: string;
  brands?: string[];
  maxPrice?: number;
  minPrice?: number;
  cuisineTags?: string[];
  mealTypes?: string[];
  minDiscount?: number;
}

class QueryParserService {
  private getApiKey(): string | undefined {
    return process.env.GOOGLE_AI_STUDIO_API_KEY;
  }

  async parseQuery(query: string): Promise<ParsedFilters | null> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn("[QueryParser] Missing GOOGLE_AI_STUDIO_API_KEY");
      return null;
    }

    const prompt = `
      Extract search filters from the following natural language query: "${query}".
      Return a JSON object with the following optional keys:
      - brand (string): a single brand name like "KFC" or "McDonald's"
      - brands (array of strings): multiple brand names if mentioned
      - maxPrice (number): the maximum price mentioned
      - minPrice (number): the minimum price mentioned
      - cuisineTags (array of strings): types of food like "burgers", "pizza", "deals"
      - mealTypes (array of strings): meal categories like "lunch", "dinner", "combo"
      - minDiscount (number): minimum discount percentage mentioned

      Only include keys where a value was found. Return ONLY the JSON object, no other text.
    `;

    try {
      console.log(`[QueryParser] Sending query to Gemini: "${query}"`);
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-lite-latest:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        console.warn("[QueryParser] No text content in Gemini response");
        return null;
      }

      console.log(`[QueryParser] Gemini response: ${text.trim()}`);

      // Extract JSON from response (handling potential markdown formatting)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return parsed;
        } catch (e) {
          console.error("[QueryParser] Failed to parse JSON from Gemini response:", e);
          return null;
        }
      }

      console.warn("[QueryParser] No JSON found in Gemini response");
      return null;
    } catch (error) {
      console.error("[QueryParser] Failed to parse query:", error);
      return null;
    }
  }
}

export const queryParserService = new QueryParserService();
