export interface Deal {
  id: number;
  externalId: string;
  title: string;
  description: string;
  price: number;
  image: string;
  brand: string;
}

export interface ApiResponse {
  success: boolean;
  data: Deal[];
  message?: string;
}

export const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:3000";
export const recommendationBaseUrl = process.env.NEXT_PUBLIC_RECOMMENDATION_URL ?? "";

export const buildQuery = (params: Record<string, string | undefined>) => {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value && value.trim().length > 0) {
      searchParams.set(key, value.trim());
    }
  }

  return searchParams.toString();
};

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);