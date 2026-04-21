import { trackClickRepository } from "../repositories/trackClick.repository.js";

export type TrackClickPayload = {
  dealId: number;
  userId?: string | null;
};

export const trackService = {
  trackClick: async (payload: TrackClickPayload) => {
    if (!Number.isFinite(payload.dealId) || payload.dealId <= 0) {
      throw new Error("dealId must be a positive number.");
    }

    return trackClickRepository.create(payload);
  },
};