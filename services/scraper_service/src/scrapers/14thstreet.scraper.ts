import axios from "axios";
import { BaseScraper } from "./base.scraper.js";
import { Deal } from "../interfaces/deal.interface.js";
import { mapFourteenthStreetDeals } from "../adapters/deal.adapter.js";
import { ScraperSourceDocument } from "../models/scraperSources.js";

// DEAL KEYWORDS (extended)
const DEAL_KEYWORDS = ["deal", "deals", "platter", "feast", "special"];

/**
 * group filter
 */
function isDealGroup(name: string): boolean {
  const lower = name?.toLowerCase() || "";
  return DEAL_KEYWORDS.some((k) => lower.includes(k));
}

/**
 * day check
 */
function isTodayActive(section: any): boolean {
  const days = ["sun", "mon", "tues", "wed", "thurs", "fri", "sat"];

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })
  );

  const todayIndex = now.getDay();
  const dayKey = days[todayIndex];

  return section?.[dayKey] === 1 || section?.[dayKey] === undefined;
}

/**
 * time helpers
 */
function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;

  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (modifier === "PM" && hours !== 12) hours += 12;
  if (modifier === "AM" && hours === 12) hours = 0;

  return hours * 60 + minutes;
}

function isWithinTimeRange(from: string, till: string): boolean {
  if (!from || !till) return true;

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Karachi" })
  );

  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const fromMin = timeToMinutes(from);
  const tillMin = timeToMinutes(till);

  if (fromMin <= tillMin) {
    return currentMinutes >= fromMin && currentMinutes <= tillMin;
  }

  return currentMinutes >= fromMin || currentMinutes <= tillMin;
}


export class FourteenthStreetScraper extends BaseScraper {
  async fetchDeals(source: ScraperSourceDocument): Promise<Deal[]> {
    try {
      const response = await axios.get(source.scrapApiURl, {
        params: source.queryParams,
        headers: source.headers
      });

      const rawDeals: any[] = [];

      const menu = response.data?.data?.[0] || response.data?.menu;

      if (!menu) return [];

      for (const section of menu.all_section || menu.sections || []) {
        const sectionName = section?.name || "";

        if (!isDealGroup(sectionName)) continue;
        if (!isTodayActive(section)) continue;

        if (!isWithinTimeRange(section?.available_from, section?.available_till))
          continue;

        for (const sub of section?.all_sub_section || section?.sub_sections || []) {
          for (const dish of sub?.dish || sub?.items || []) {

            const isDealItem =
              dish?.isdeal === 1 ||
              DEAL_KEYWORDS.some(k =>
                (dish?.name || "").toLowerCase().includes(k)
              );

            if (!isDealItem) continue;

            rawDeals.push({
              id: dish?.id,
              name: dish?.name,
              description: dish?.desc || dish?.description || "",
              price: dish?.price || 0,
              salePrice: dish?.discount_price || dish?.sale_price || 0,
              imgUrl: dish?.img_url || dish?.image || "",
              category: sectionName
            });
          }
        }
      }

      return mapFourteenthStreetDeals(rawDeals, "14street");

    } catch (error: any) {
      console.error(
        "14th Street Scraper Error:",
        error.response?.status,
        error.response?.data || error.message
      );
      return [];
    }
  }
}