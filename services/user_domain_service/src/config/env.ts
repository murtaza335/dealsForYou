import "dotenv/config";

const parsePort = (value: string | undefined, fallback: number): number => {
	const parsed = Number(value);
	return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
};

export const env = {
	PORT: parsePort(process.env.PORT, 3000),
	DATABASE_URL: process.env.DATABASE_URL?.trim() || undefined,
	DEALS_SERVICE_URL: process.env.DEALS_SERVICE_URL?.trim() || "http://localhost:5002",
};

