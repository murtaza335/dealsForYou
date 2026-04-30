export interface Deal {
  id: number;
  externalId: string;
  title: string;
  description: string;
  price: number;
  imgUrl: string;
  brandSlug: string;
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
    if (typeof value === "string" && value.trim().length > 0) {
      searchParams.set(key, value.trim());
    }
  }

  return searchParams.toString();
};

export const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(price);

export const withBearerToken = (
  token: string | null,
  initHeaders?: HeadersInit
): Headers => {
  const headers = new Headers(initHeaders);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return headers;
};