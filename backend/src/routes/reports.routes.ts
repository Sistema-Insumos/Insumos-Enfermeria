import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const reportsRouter = Router();
reportsRouter.use(requireAuth);

reportsRouter.get(
  "/annual",
  asyncHandler(async (req, res) => {
    const year = req.query.year ? Number(req.query.year) : undefined;
    const semester = req.query.semester ? Number(req.query.semester) : undefined;
    const sectionFilter = year || semester ? { year, semester } : undefined;

    const supplies = await prisma.supply.findMany({
      include: {
        consumptionRecords: sectionFilter ? { where: { section: sectionFilter } } : true,
      },
    });

    const items = supplies
      .filter((s) => s.consumptionRecords.length > 0)
      .map((supply) => {
        const totalReused = supply.consumptionRecords.reduce(
          (sum, r) => sum + Number(r.reusedQty),
          0
        );
        const totalDiscarded = supply.consumptionRecords.reduce(
          (sum, r) => sum + Number(r.wasteQty) + Number(r.discardedQty),
          0
        );

        const total = totalReused + totalDiscarded;
        const efficiency = total > 0 ? (totalReused / total) * 100 : 0;

        const maxStock = supply.maxStock;
        const stockRatio = maxStock ? Math.min(supply.currentStock / maxStock, 1) * 100 : null;
        const qtyToBuy = maxStock ? Math.max(maxStock - supply.currentStock, 0) : 0;

        return {
          id: supply.id,
          name: supply.name,
          category: supply.category,
          totalReused,
          totalDiscarded,
          efficiency,
          currentStock: supply.currentStock,
          maxStock,
          stockRatio,
          qtyToBuy,
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

    res.json({ items, ...totals, avgEfficiency, year: year ?? null, semester: semester ?? null });
  })
);
