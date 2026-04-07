import { Request, Response } from "express";

export const healthCheck = (req: Request, res: Response): Response => {
  return res.status(200).json({
    success: true,
    message: "API is running 🚀",
  });
};
