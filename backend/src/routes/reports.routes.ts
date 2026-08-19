import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

reportsRouter.get(
  "/annual",
  asyncHandler(async (_req, res) => {
    const supplies = await prisma.supply.findMany({ include: { consumptionRecords: true } });

    const items = supplies
      .filter((s) => s.consumptionRecords.length > 0)
      .map((supply) => {
        const totalReused = supply.consumptionRecords.reduce(
          (sum, r) => sum + (r.postClassAction === "REUSE" ? Number(r.reuseQty ?? 0) : 0),
          0
        );
        const totalDiscarded = supply.consumptionRecords.reduce((sum, r) => {
          const used = Number(r.usedQty);
          const reused = r.postClassAction === "REUSE" ? Number(r.reuseQty ?? 0) : 0;
          return sum + Number(r.wasteQty) + (used - reused);
        }, 0);

        const total = totalReused + totalDiscarded;
        const efficiency = total > 0 ? (totalReused / total) * 100 : 0;

        return {
          id: supply.id,
          name: supply.name,
          category: supply.category,
          totalReused,
          totalDiscarded,
          efficiency,
        };
      });

    const totals = items.reduce(
      (acc, item) => ({
        totalReused: acc.totalReused + item.totalReused,
        totalDiscarded: acc.totalDiscarded + item.totalDiscarded,
      }),
      { totalReused: 0, totalDiscarded: 0 }
    );

    const avgEfficiency =
      items.length > 0 ? items.reduce((sum, i) => sum + i.efficiency, 0) / items.length : 0;

    res.json({ items, ...totals, avgEfficiency });
  })
);
