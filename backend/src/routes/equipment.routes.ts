import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const equipmentRouter = Router();
equipmentRouter.use(requireAuth);

equipmentRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { search } = req.query as Record<string, string>;

    const items = await prisma.equipment.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { code: { contains: search, mode: "insensitive" } },
            ],
          }
        : undefined,
      include: { linkedSupplies: { include: { supply: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json(items);
  })
);

equipmentRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const equipment = await prisma.equipment.findUnique({
      where: { id: req.params.id },
      include: { linkedSupplies: { include: { supply: true } }, usages: true },
    });
    if (!equipment) return res.status(404).json({ error: "Equipo no encontrado" });
    res.json(equipment);
  })
);

const linkedSupplySchema = z.object({
  supplyId: z.string().min(1),
  minThreshold: z.number().int().min(0).default(0),
  maxThreshold: z.number().int().min(0).optional(),
  autoDiscount: z.boolean().default(false),
});

const equipmentSchema = z.object({
  code: z.string().min(1),
  serial: z.string().optional(),
  name: z.string().min(1),
  category: z.string().min(1),
  quantity: z.number().int().min(1).default(1),
  location: z.string().optional(),
  status: z.enum(["OPERATIVE", "MAINTENANCE", "OUT_OF_SERVICE"]).default("OPERATIVE"),
  unitValue: z.number().min(0).default(0),
  linkedSupplies: z.array(linkedSupplySchema).default([]),
});

equipmentRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = equipmentSchema.parse(req.body);
    const { linkedSupplies, ...rest } = data;

    const equipment = await prisma.equipment.create({
      data: {
        ...rest,
        linkedSupplies: { create: linkedSupplies },
      },
    });

    res.status(201).json(equipment);
  })
);

equipmentRouter.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = equipmentSchema.partial().parse(req.body);
    const { linkedSupplies, ...rest } = data;

    const equipment = await prisma.equipment.update({
      where: { id: req.params.id },
      data: {
        ...rest,
        ...(linkedSupplies
          ? { linkedSupplies: { deleteMany: {}, create: linkedSupplies } }
          : {}),
      },
    });

    res.json(equipment);
  })
);

equipmentRouter.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.equipment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
