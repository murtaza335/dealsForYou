export interface Deal {
  id?: number;
  dealId: string;
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

export interface DomainUser {
  id: string;
  clerkUserId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: "END_USER" | "BRAND_ADMIN" | "APP_ADMIN";
  isActive: boolean;
  brandId: string | null;
  metadata: Record<string, unknown>;
  brand?: BrandProfile | null;
}

export interface BrandProfile {
  brandId: string;
  name: string;
  slug: string;
  logoUrl?: string;
  imgUrl?: string;
  website?: string;
  description?: string;
  contactEmail?: string;
  contactPhone?: string;
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED";
  scrapeRequested: boolean;
  scraperStatus: "NOT_REQUESTED" | "PENDING_SETUP" | "ACTIVE" | "DISABLED";
  manualDealManagementEnabled: boolean;
  cities?: string[];
  areas?: string[];
  cuisineTags?: string[];
  notes?: string;
}

export const authHeaders = (token?: string | null): HeadersInit =>
  token ? { Authorization: `Bearer ${token}` } : {};

export const getRoleHomePath = (user: DomainUser | null) => {
  if (!user) return "/sign-up";
  if (user.role === "APP_ADMIN") return "/app-admin/approvals";
  if (user.role === "BRAND_ADMIN") {
    return user.brand?.approvalStatus === "APPROVED" ? "/brand-admin" : "/brand-admin/pending";
  }
  return "/";
};

export async function fetchDomainUser(token?: string | null): Promise<DomainUser | null> {
  if (!token) return null;

  const response = await fetch(`${apiBaseUrl}/api/users/me`, {
    headers: authHeaders(token),
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error("Could not fetch your profile.");

  const payload = await response.json();
  return payload.data ?? null;
}

export async function uploadImage(file: File, folder: string): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read image file."));
    reader.readAsDataURL(file);
  });

  const response = await fetch(`${apiBaseUrl}/api/uploads/cloudinary`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: dataUrl, folder }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload?.message ?? "Image upload failed.");
  }

  return payload.data.url;
}

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
