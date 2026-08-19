import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const suppliersRouter = Router();
suppliersRouter.use(requireAuth);

suppliersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const suppliers = await prisma.supplier.findMany({ orderBy: { name: "asc" } });
    res.json(suppliers);
  })
);

const supplierSchema = z.object({
  name: z.string().min(1),
  rating: z.number().min(0).max(5).optional(),
  contact: z.string().optional(),
});

suppliersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = supplierSchema.parse(req.body);
    const supplier = await prisma.supplier.create({ data });
    res.status(201).json(supplier);
  })
);
