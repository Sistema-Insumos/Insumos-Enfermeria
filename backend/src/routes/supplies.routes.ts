import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const suppliesRouter = Router();
suppliesRouter.use(requireAuth);

suppliesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search, category, page = "1", pageSize = "20" } = req.query as Record<string, string>;

    const where = {
      AND: [
        search
          ? {
              OR: [
                { name: { contains: search, mode: "insensitive" as const } },
                { sku: { contains: search, mode: "insensitive" as const } },
              ],
            }
          : {},
        category ? { category } : {},
      ],
    };

    const take = Math.min(Number(pageSize) || 20, 100);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const [items, total] = await Promise.all([
      prisma.supply.findMany({ where, take, skip, orderBy: { createdAt: "desc" } }),
      prisma.supply.count({ where }),
    ]);

    res.json({ items, total, page: Number(page), pageSize: take });
  })
);

suppliesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const supply = await prisma.supply.findUnique({
      where: { id: req.params.id },
      include: { subjects: { include: { subject: true } } },
    });
    if (!supply) return res.status(404).json({ error: "Insumo no encontrado" });
    res.json(supply);
  })
);

const supplySchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1),
  category: z.string().min(1),
  description: z.string().optional(),
  locationType: z.string().optional(),
  locationDetail: z.string().optional(),
  unit: z.string().default("uds"),
  initialStock: z.number().int().min(0).default(0),
  currentStock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).optional(),
  subjectIds: z.array(z.string()).default([]),
});

function generateSku(name: string, category: string) {
  const prefix = category.slice(0, 3).toUpperCase();
  const suffix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "GEN";
  const random = Math.floor(100 + Math.random() * 900);
  return `${prefix}-${suffix}-${random}`;
}

suppliesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = supplySchema.parse(req.body);
    const sku = data.sku && data.sku.length > 0 ? data.sku : generateSku(data.name, data.category);

    const supply = await prisma.supply.create({
      data: {
        sku,
        name: data.name,
        category: data.category,
        description: data.description,
        locationType: data.locationType,
        locationDetail: data.locationDetail,
        unit: data.unit,
        initialStock: data.initialStock,
        currentStock: data.initialStock,
        newStock: data.initialStock,
        minStock: data.minStock,
        maxStock: data.maxStock,
        subjects: {
          create: data.subjectIds.map((subjectId) => ({ subjectId })),
        },
      },
    });

    res.status(201).json(supply);
  })
);

suppliesRouter.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = supplySchema.partial().parse(req.body);
    const { subjectIds, currentStock, ...rest } = data;

    const supply = await prisma.supply.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        // A manual stock correction resets the new/reusable split: the corrected
        // total is treated as fresh stock rather than guessing how to divide it.
        ...(currentStock !== undefined
          ? { currentStock, newStock: currentStock, reusableStock: 0 }
          : {}),
        ...(subjectIds
          ? {
              subjects: {
                deleteMany: {},
                create: subjectIds.map((subjectId) => ({ subjectId })),
              },
            }
          : {}),
      },
    });

    res.json(supply);
  })
);

suppliesRouter.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.supply.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
