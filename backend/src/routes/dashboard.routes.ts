import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const dashboardRouter = Router();
dashboardRouter.use(requireAuth);

dashboardRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const supplies = await prisma.supply.findMany();
    const categories = new Set(supplies.map((s) => s.category));
    const lowStock = supplies.filter((s) => s.currentStock < s.minStock);
    const totalValue = supplies.reduce((sum, s) => sum + s.currentStock * Number(s.unitValue), 0);

    const pendingOrders = await prisma.purchaseOrder.count({ where: { status: "SENT" } });

    res.json({
      totalInventoryValue: totalValue,
      totalSkus: supplies.length,
      lowStockCount: lowStock.length,
      categoriesCount: categories.size,
      pendingOrders,
    });
  })
);
