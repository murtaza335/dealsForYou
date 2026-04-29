class UserDomainService {
  private getBaseUrl() {
    return process.env.USER_DOMAIN_URL ?? "http://localhost:3000";
  }

  async fetchMe(authorization?: string) {
    const response = await fetch(`${this.getBaseUrl().replace(/\/$/, "")}/api/users/me`, {
      headers: authorization ? { Authorization: authorization } : {},
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user profile (${response.status}).`);
    }

    const payload = (await response.json()) as { data?: any };
    return payload.data;
  }

  async onboardConsumer(payload: unknown) {
    return this.forwardOnboarding("/api/users/onboard/consumer", payload);
  }

  async onboardBrandAdmin(payload: unknown) {
    return this.forwardOnboarding("/api/users/onboard/brand-admin", payload);
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
