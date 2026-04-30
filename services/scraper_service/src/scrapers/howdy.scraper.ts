import axios from "axios";
import { BaseScraper } from "./base.scraper.js";
import { Deal } from "../interfaces/deal.interface.js";
import { mapHowdyDeals } from "../adapters/deal.adapter.js";
import { ScraperSourceDocument } from "../models/scraperSources.js";


// hosdy meny api respnse has a data array that has one object in which first the menu detail then that deatil has section all section is an array in which each section is stored and in each section there is a all_sub_section array in which there is dish array in which the deal or other item is stored . we first filter the section based on their name if it include deal related keyword then we check weather that category is active or not by checking the day field if that category is active for today then we check weather that category is active for current time by checking available_from and available_till field if that category is active for current time then we loop through its sub section and then loop through its dish and check if that dish is deal or not by checking isdeal field if it is deal then we push it in rawdeals array and then we map that rawdeals to our internal format using mapHowdyDeals function

// there also require query params 

// HOWDY SCRAPER
const DEAL_KEYWORDS = ["deal", "deals", "platter", "feast"];

// group filter (FIXED — more flexible)
function isDealGroup(name: string): boolean {
  const lower = name?.toLowerCase() || "";
  return DEAL_KEYWORDS.some((k) => lower.includes(k));
}

// day check (FIXED safe)

function isTodayActive(section: any): boolean {
  const days = ["sun", "mon", "tues", "wed", "thurs", "fri", "sat"];

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })
  );

  const todayIndex = now.getDay();
  const dayKey = days[todayIndex];

  // IMPORTANT: if field missing → assume active (avoid blocking deals)
  return section?.[dayKey] === 1 || section?.[dayKey] === undefined;
}

/**
 * time conversion
 */
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;

  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

/**
 * time range check (FIXED safer)
 */
function isWithinTimeRange(from: string, till: string): boolean {
  if (!from || !till) return true;

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })
  );

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const fromMin = timeToMinutes(from);
  const tillMin = timeToMinutes(till);

  // handle overnight range also
  if (fromMin <= tillMin) {
    return currentMinutes >= fromMin && currentMinutes <= tillMin;
  }

  return currentMinutes >= fromMin || currentMinutes <= tillMin;
}

export class HowdyScraper extends BaseScraper {
  async fetchDeals(source: ScraperSourceDocument): Promise<Deal[]> {
    try {
      const response = await axios.get(source.scrapApiURl, {
        params: source.queryParams,
        headers: source.headers
      });

      const rawDeals: any[] = [];
      const menu = response.data?.data?.[0];

      if (!menu) return [];

      for (const section of menu.all_section || []) {
        const sectionName = section?.name || "";

        // STEP 1: group filter (FIXED)
        if (!isDealGroup(sectionName)) continue;

        // STEP 2: day filter
        if (!isTodayActive(section)) continue;

        // STEP 3: time filter
        if (!isWithinTimeRange(section?.available_from, section?.available_till)) continue;

        // STEP 4: dishes
        for (const sub of section?.all_sub_section || []) {
          for (const dish of sub?.dish || []) {
            
            // IMPORTANT FIX: also check isdeal flag
            if (dish?.isdeal !== 1) continue;

            rawDeals.push({
              id: dish?.id,
              name: dish?.name,
              description: dish?.desc || "",
              price: dish?.price || 0,
              salePrice: dish?.discount_price || 0,
              imgUrl: dish?.img_url || "",
              category: sectionName
            });
          }
        }
      }

      return mapHowdyDeals(rawDeals, "howdy");

    } catch (error: any) {
      console.error(
        "Howdy Scraper Error:",
        error.response?.status,
        error.response?.data || error.message
      );
      return [];
    }
  }
}