import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const equipmentSuppliesRouter = Router();
equipmentSuppliesRouter.use(requireAuth);

const SORTABLE_FIELDS = ["name", "sku", "category", "currentStock", "minStock", "maxStock", "createdAt"];

equipmentSuppliesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const {
      search,
      category,
      page = "1",
      pageSize = "20",
      sortBy = "createdAt",
      sortDir = "desc",
    } = req.query as Record<string, string>;

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

    const take = Math.min(Number(pageSize) || 20, 1000);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;
    const orderField = SORTABLE_FIELDS.includes(sortBy) ? sortBy : "createdAt";
    const orderDir = sortDir === "asc" ? "asc" : "desc";

    const [items, total] = await Promise.all([
      prisma.equipmentSupply.findMany({ where, take, skip, orderBy: { [orderField]: orderDir } }),
      prisma.equipmentSupply.count({ where }),
    ]);

    res.json({ items, total, page: Number(page), pageSize: take });
  })
);

equipmentSuppliesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const item = await prisma.equipmentSupply.findUnique({ where: { id: req.params.id } });
    if (!item) return res.status(404).json({ error: "Insumo de equipamiento no encontrado" });
    res.json(item);
  })
);

const equipmentSupplySchema = z.object({
  sku: z.string().optional(),
  name: z.string().min(1),
  category: z.string().min(1).default("General"),
  unit: z.string().default("uds"),
  currentStock: z.number().int().min(0).optional(),
  minStock: z.number().int().min(0).default(0),
  maxStock: z.number().int().min(0).optional(),
});

function generateSku(name: string, category: string) {
  const prefix = category.slice(0, 3).toUpperCase();
  const suffix = name.replace(/[^a-zA-Z]/g, "").slice(0, 3).toUpperCase() || "GEN";
  const random = Math.floor(100 + Math.random() * 900);
  return `EQS-${prefix}-${suffix}-${random}`;
}

equipmentSuppliesRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = equipmentSupplySchema.parse(req.body);
    const sku = data.sku && data.sku.length > 0 ? data.sku : generateSku(data.name, data.category);
    const initialStock = data.currentStock ?? 0;

    const item = await prisma.equipmentSupply.create({
      data: {
        sku,
        name: data.name,
        category: data.category,
        unit: data.unit,
        currentStock: initialStock,
        newStock: initialStock,
        minStock: data.minStock,
        maxStock: data.maxStock,
      },
    });

    res.status(201).json(item);
  })
);

equipmentSuppliesRouter.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = equipmentSupplySchema.partial().parse(req.body);
    const { currentStock, ...rest } = data;

    const item = await prisma.equipmentSupply.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(currentStock !== undefined
          ? { currentStock, newStock: currentStock, reusableStock: 0 }
          : {}),
      },
    });

    res.json(item);
  })
);

equipmentSuppliesRouter.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.equipmentSupply.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
