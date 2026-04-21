import { TrackClickModel } from "../models/trackClick.model.js";

export type TrackClickInput = {
  dealId: number;
  userId?: string | null;
};

export const trackClickRepository = {
  create: async (input: TrackClickInput) => {
    return TrackClickModel.create({
      dealId: input.dealId,
      userId: input.userId ?? null,
    });
  },
};