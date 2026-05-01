type UserRole = "END_USER" | "BRAND_ADMIN" | "APP_ADMIN";

class UserDomainService {
  private getBaseUrl() {
    return process.env.USER_DOMAIN_URL ?? "http://localhost:3000";
  }

  private getInternalHeaders(): HeadersInit {
    const secret = process.env.API_GATEWAY_INTERNAL_SECRET;
    return secret ? { "x-api-gateway-secret": secret } : {};
  }

  async fetchMe(authorization?: string, clerkUserId?: string) {
    const response = await fetch(`${this.getBaseUrl().replace(/\/$/, "")}/api/users/me`, {
      headers: {
        ...(authorization ? { Authorization: authorization } : {}),
        ...(clerkUserId ? { "user-id": clerkUserId } : {}),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile (${response.status}).`);
    }

    const payload = (await response.json()) as { data?: any };
    return payload.data;
  }

  async listUsers(role?: UserRole) {
    const url = new URL(`${this.getBaseUrl().replace(/\/$/, "")}/api/users/admin/internal/users`);
    if (role) url.searchParams.set("role", role);

    const response = await fetch(url, {
      headers: this.getInternalHeaders(),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.message ?? `Failed to list users (${response.status}).`);
    }

    return payload.data ?? [];
  }

  async getUser(userId: string) {
    const users = await this.listUsers();
    return users.find((user: { id: string }) => user.id === userId) ?? null;
  }

  async suspendUser(userId: string) {
    const response = await fetch(`${this.getBaseUrl().replace(/\/$/, "")}/api/users/admin/internal/users/${encodeURIComponent(userId)}/suspend`, {
      method: "PATCH",
      headers: this.getInternalHeaders(),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.message ?? `Failed to suspend user (${response.status}).`);
    }

    return payload.data;
  }

  async deleteUser(userId: string) {
    const response = await fetch(`${this.getBaseUrl().replace(/\/$/, "")}/api/users/admin/internal/users/${encodeURIComponent(userId)}`, {
      method: "DELETE",
      headers: this.getInternalHeaders(),
    });
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(payload?.message ?? `Failed to delete user (${response.status}).`);
    }

    return payload.data;
  }

  async onboardConsumer(payload: unknown) {
    return this.forwardOnboarding("/api/users/onboard/consumer", payload);
  }

  async onboardBrandAdmin(payload: unknown) {
    return this.forwardOnboarding("/api/users/onboard/brand-admin", payload);
  }

  async upsertFromClerk(payload: unknown) {
    return this.forwardOnboarding("/api/users/upsert-from-clerk", payload);
  }

  private async forwardOnboarding(pathname: string, payload: unknown) {
    const response = await fetch(`${this.getBaseUrl().replace(/\/$/, "")}${pathname}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body?.message ?? body?.error ?? `Onboarding failed (${response.status}).`);
    }

    return body;
  }
}

export const userDomainService = new UserDomainService();
