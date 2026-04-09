import { Deal } from "../interfaces/deal.interface.js";

// dominos scraper output structure is being mapped to our internal Deal structure here
export const mapDominosDeals = (rawDeals: any[]): Deal[] => {
  return rawDeals.map(deal => ({
    id: Number(deal.combo_id),
    name: deal.name,
    description: deal.description,
    price: Number(deal.price),
    salePrice: Number(deal.salePrice ?? 0),
    image: deal.image,
    category: deal.category || "Deals",
    brandSlug: "dominos",
    isActive: true,
    publishedAt: new Date()
  }));
};


// KFC has a little different logic for mapping deals, so we do that here
export const mapKfcDeals = (rawDeals: any[], brandSlug: string): Deal[] => {
  return rawDeals.map(deal => ({
    id: Number(deal.id),
    name: deal.name,
    description: deal.description,
    price: Number(deal.price),
    salePrice: Number(deal.salePrice ?? 0),
    image: deal.image,
    category: deal.category || "KFC Deals",
    brandSlug,
    isActive: true,
    publishedAt: new Date()
  }));
};