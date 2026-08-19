import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const projectionsRouter = Router();
projectionsRouter.use(requireAuth);

projectionsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const supplies = await prisma.supply.findMany({
      include: { consumptionRecords: true },
    });

    const items = supplies.map((supply) => {
      const historicalDemand = supply.consumptionRecords.reduce(
        (sum, r) => sum + Number(r.requiredQty),
        0
      );
      const projectedNeed = historicalDemand > 0 ? historicalDemand : supply.minStock * 2;
      const diff = supply.currentStock - projectedNeed;

      let status: "CRITICO" | "ATENCION" | "SUFICIENTE" = "SUFICIENTE";
      if (diff < 0 && Math.abs(diff) >= supply.minStock) status = "CRITICO";
      else if (diff < 0) status = "ATENCION";

      const estimatedCost = diff < 0 ? Math.abs(diff) * Number(supply.unitValue) : 0;

      return {
        id: supply.id,
        sku: supply.sku,
        name: supply.name,
        category: supply.category,
        currentStock: supply.currentStock,
        projectedNeed,
        diff,
        status,
        estimatedCost,
      };
    });

    const criticalCount = items.filter((i) => i.status === "CRITICO").length;
    const totalEstimatedCost = items.reduce((sum, i) => sum + i.estimatedCost, 0);

    res.json({ items, criticalCount, totalEstimatedCost });
  })
);

const futureNeedSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  estimatedQty: z.number().int().min(0),
  requiredDate: z.string(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
});

projectionsRouter.get(
  "/future-needs",
  asyncHandler(async (_req, res) => {
    const needs = await prisma.futureSupplyNeed.findMany({ orderBy: { requiredDate: "asc" } });
    res.json(needs);
  })
);

projectionsRouter.post(
  "/future-needs",
  asyncHandler(async (req, res) => {
    const data = futureNeedSchema.parse(req.body);
    const need = await prisma.futureSupplyNeed.create({
      data: { ...data, requiredDate: new Date(data.requiredDate) },
    });
    res.status(201).json(need);
  })
);
