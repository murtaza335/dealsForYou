import { ScraperControlRepository } from "../repositories/scrapercontrol.js";

const normalizeObjectInput = (
  value: unknown,
  fieldName: string
): Record<string, unknown> => {
  if (value === undefined || value === null) return {};

  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        return parsed as Record<string, unknown>;
      }
    } catch {
      throw new Error(`${fieldName} must be a valid JSON object string`);
    }
  }

  if (typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }

  throw new Error(`${fieldName} must be an object`);
};

export class ScraperControlService {
  private repo = new ScraperControlRepository();

  async list() {
    return this.repo.listScraperSources();
  }

  async getBySlug(slug: string) {
    return this.repo.getScraperSourceBySlug(slug);
  }

  async create(payload: {
    brandName: string;
    slug: string;
    baseApiUrl: string;
    scrapApiURl: string;
    body?: unknown;
    headers?: unknown;
    scrapingInterval?: number;
    scrapingTime?: { day: string; timePeriods: { open: string; close: string }[] }[];
    isActive?: boolean;
  }) {
    return this.repo.createScraperSource({
      ...payload,
      slug: payload.slug.trim().toLowerCase(),
      body: normalizeObjectInput(payload.body, "body"),
      headers: normalizeObjectInput(payload.headers, "headers")
    });
  }

  async update(
    slug: string,
    payload: Partial<{
      brandName: string;
      baseApiUrl: string;
      scrapApiURl: string;
      body: unknown;
      headers: unknown;
      scrapingInterval: number;
      scrapingTime: { day: string; timePeriods: { open: string; close: string }[] }[];
      isActive: boolean;
    }>
  ) {
    const patch: Partial<{
      brandName: string;
      baseApiUrl: string;
      scrapApiURl: string;
      body: Record<string, unknown>;
      headers: Record<string, unknown>;
      scrapingInterval: number;
      scrapingTime: { day: string; timePeriods: { open: string; close: string }[] }[];
      isActive: boolean;
    }> = {};

    if (payload.brandName !== undefined) patch.brandName = payload.brandName;
    if (payload.baseApiUrl !== undefined) patch.baseApiUrl = payload.baseApiUrl;
    if (payload.scrapApiURl !== undefined) patch.scrapApiURl = payload.scrapApiURl;
    if (payload.scrapingInterval !== undefined) patch.scrapingInterval = payload.scrapingInterval;
    if (payload.scrapingTime !== undefined) patch.scrapingTime = payload.scrapingTime;
    if (payload.isActive !== undefined) patch.isActive = payload.isActive;

    if (payload.body !== undefined) {
      patch.body = normalizeObjectInput(payload.body, "body");
    }

    if (payload.headers !== undefined) {
      patch.headers = normalizeObjectInput(payload.headers, "headers");
    }

    return this.repo.updateScraperSourceBySlug(slug.trim().toLowerCase(), patch);
  }

  async activate(slug: string) {
    return this.repo.activateScraperSource(slug.trim().toLowerCase());
  }

  async deactivate(slug: string) {
    return this.repo.deactivateScraperSource(slug.trim().toLowerCase());
  }
}
