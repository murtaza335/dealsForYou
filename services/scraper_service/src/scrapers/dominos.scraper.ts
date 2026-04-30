import axios from "axios";
import { BaseScraper } from "./base.scraper.js";
import { mapDominosDeals } from "../adapters/deal.adapter.js";
import { Deal } from "../interfaces/deal.interface.js";
import { ScraperSourceDocument } from "../models/scraperSources.js";


// the dominos menu/menudata api response has menu array in which there is array of groups and subgroups and menudata array that has the detail of all the items in the menu we filter those on the base of group id 11 as it is the deals group and only item that has data in the data array is return because the implement active deal by sending data for only active deals in the data array

const normalizeImageUrl = (
  imagePath: string | undefined,
  imageBaseUrl: string
): string => {
  if (!imagePath) return imageBaseUrl;
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  const cleanBase = imageBaseUrl.endsWith("/")
    ? imageBaseUrl
    : `${imageBaseUrl}/`;
  const cleanPath = imagePath.startsWith("/") ? imagePath.slice(1) : imagePath;
  return `${cleanBase}${cleanPath}`;
};

// Dominos scraper implementation 
export class DominosScraper extends BaseScraper {
  async fetchDeals(source: ScraperSourceDocument): Promise<Deal[]> {
    try {
      const requestBody =
        source.body && typeof source.body === "object" && !Array.isArray(source.body)
          ? source.body
          : {};

      const requestHeaders =
        source.headers && typeof source.headers === "object" && !Array.isArray(source.headers)
          ? source.headers
          : {};

          // concat /images to the imageBaseUrl
      const imageBaseUrl = source.baseApiUrl + "/images" || "https://www.dominos.com.pk/images/";

      const response = await axios.post(
        source.scrapApiURl,
        requestBody,
        {
          headers: requestHeaders
        }
      );

      //filter out the deals from the menu data and map it to our internal Deal structure
      const menuData = response.data?.menu?.menuData || [];

      // group 11 is the deals group of the dominos menu.
      const dealsGroups = menuData.filter((item: any) => item.group_id === 11);

      const rawDeals = dealsGroups
        .filter((item: any) => Array.isArray(item.data))
        .flatMap((item: any) =>
          item.data.map((deal: any) => ({
            combo_id: deal.combo_id,
            name: deal.combo_name,
            description: deal.combo_description,
            price: deal.combo_mrp_price,
            salePrice: deal.combo_sale_price,
            imgUrl: normalizeImageUrl(deal.image_url, imageBaseUrl),
            category:
              item.sub_group_name ||
              item.subgroup_name ||
              item.group_name ||
              "Deals"
          }))
        );

      return mapDominosDeals(rawDeals);

    } catch (error: any) {
      console.error("Dominos Scraper Error:", error.message);
      return [];
    }
  }
}

//dominos time check not required as if they deals are not active at that time they dont send that deal data the sent empty array and we have filter only those that have deals data otherwise deal will not be included in the final output