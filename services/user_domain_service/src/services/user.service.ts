import { AppError } from "../error.js";
import { UserRepository } from "../repositories/user.repository.js";
import type { UpdateMyProfilePayload, UpsertUserPayload, UserEntity } from "../types/user.type.js";
import { USER_ROLES } from "../types/role.type.js";
import { env } from "../config/env.js";

type ConsumerOnboardingPayload = {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  city?: string;
  area?: string;
  foodPreferences?: string[];
};

type BrandAdminOnboardingPayload = {
  clerkUserId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  title: string;
  brand: Record<string, unknown>;
};

export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

  findByClerkUserId(clerkUserId: string): Promise<UserEntity | null> {
    return this.userRepository.findByClerkUserId(clerkUserId);
  }

  listAllUsers(): Promise<UserEntity[]> {
    return this.userRepository.listAll();
  }

  upsertUser(payload: UpsertUserPayload): Promise<UserEntity> {
    return this.userRepository.upsertUser(payload);
  }

  onboardConsumer(payload: ConsumerOnboardingPayload): Promise<UserEntity> {
    return this.userRepository.upsertUser({
      clerkUserId: payload.clerkUserId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: USER_ROLES.END_USER,
      isActive: true,
      metadata: {
        phone: payload.phone ?? null,
        city: payload.city ?? null,
        area: payload.area ?? null,
        foodPreferences: payload.foodPreferences ?? [],
      },
    });
  }

  async onboardBrandAdmin(payload: BrandAdminOnboardingPayload): Promise<UserEntity> {
    const response = await fetch(`${env.DEALS_SERVICE_URL.replace(/\/$/, "")}/api/brands`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload.brand),
    });

    if (!response.ok) {
      const text = await response.text().catch(() => "");
      throw new AppError(`Brand onboarding failed: ${text || response.statusText}`, 400);
    }

    const brandPayload = (await response.json()) as { data?: { brandId?: string; approvalStatus?: string } };
    const brandId = brandPayload.data?.brandId;
    if (!brandId) throw new AppError("Brand onboarding failed: missing brand id", 500);

    return this.userRepository.upsertUser({
      clerkUserId: payload.clerkUserId,
      email: payload.email,
      firstName: payload.firstName,
      lastName: payload.lastName,
      role: USER_ROLES.BRAND_ADMIN,
      brandId,
      isActive: true,
      metadata: {
        phone: payload.phone,
        title: payload.title,
        approvalStatus: brandPayload.data?.approvalStatus ?? "PENDING",
      },
    });
  }

  async updateMyProfile(clerkUserId: string, payload: UpdateMyProfilePayload): Promise<UserEntity> {
    const user = await this.userRepository.updateMyProfile(clerkUserId, payload);
    if (!user) {
      throw new AppError("User not found", 404);
    }
    return user;
  }
}
