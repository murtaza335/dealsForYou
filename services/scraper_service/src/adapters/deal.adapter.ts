import { Deal } from "../interfaces/deal.interface.js";

// dominos scraper output structure is being mapped to our internal Deal structure here
export const mapDominosDeals = (rawDeals: any[]): Deal[] => {
  return rawDeals.map(deal => ({
    externalId: Number(deal.combo_id),
    title: deal.name,
    description: deal.description,
    price: Number(deal.price),
    salePrice: Number(deal.salePrice ?? 0),
    imgUrl: deal.imgUrl ?? "",
    category: deal.category || "Deals",
    brandSlug: "dominos",
    isActive: true,
    publishedAt: new Date()
  }));
};


// KFC has a little different logic for mapping deals, so we do that here
export const mapKfcDeals = (rawDeals: any[], brandSlug: string): Deal[] => {
  return rawDeals.map(deal => ({
    externalId: Number(deal.id),
    title: deal.name,
    description: deal.description,
    price: Number(deal.price),
    salePrice: Number(deal.salePrice ?? 0),
    imgUrl: deal.imgUrl ?? "",
    category: deal.category || "KFC Deals",
    brandSlug,
    isActive: true,
    publishedAt: new Date()
  }));
};

// WrapLab deals mapper

export const mapWrapLabDeals = (rawDeals: any[], brandSlug: string): Deal[] => {
  return rawDeals.map((deal) => ({
    externalId: Number(deal.id),
    title: deal.name,
    description: deal.description || "",
    price: Number(deal.price || 0),
    salePrice: Number(deal.salePrice ?? 0),
    imgUrl: deal.imgUrl ?? "",
    category: deal.category || "WrapLab Deals",
    brandSlug, // "wraplab"
    isActive: true,
    publishedAt: new Date()
  }));
};

// Howdy deals mapper

export const mapHowdyDeals = (rawDeals: any[], brandSlug: string): Deal[] => {
  return rawDeals.map((deal) => ({
    externalId: Number(deal.id),
    title: deal.name,
    description: deal.description || "",
    price: Number(deal.price || 0),
    salePrice: Number(deal.salePrice ?? 0),
    imgUrl: deal.imgUrl ?? "",
    category: deal.category || "Howdy Deals",
    brandSlug,
    isActive: true,
    publishedAt: new Date()
  }));
};

// kababjees
export const mapKababjeesDeals = (
  rawDeals: any[],
  brandSlug: string
): Deal[] => {
  return rawDeals.map((deal) => ({
    externalId: Number(deal.id),
    title: deal.name,
    description: deal.description,
    price: Number(deal.price),
    salePrice: Number(deal.salePrice ?? 0),
    imgUrl: deal.imgUrl ?? "",
    category: deal.category || "Kababjees Deals",
    brandSlug,
    isActive: true,
    publishedAt: new Date()
  }));
};

// 14th street mapper
export const mapFourteenthStreetDeals = (
  rawDeals: any[],
  brandSlug: string
): Deal[] => {
  return rawDeals.map((deal) => ({
    externalId: Number(deal.id),
    title: deal.name,
    description: deal.description || "",
    price: Number(deal.price || 0),
    salePrice: Number(deal.salePrice ?? 0),
    imgUrl: deal.imgUrl ?? "",
    category: deal.category || "14th Street Deals",
    brandSlug, // "14street"
    isActive: true,
    publishedAt: new Date()
  }));
};
