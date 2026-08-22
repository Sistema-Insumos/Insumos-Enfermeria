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
    const { search, roomId } = req.query as Record<string, string>;

    const items = await prisma.equipment.findMany({
      where: {
        AND: [
          search
            ? {
                OR: [
                  { name: { contains: search, mode: "insensitive" } },
                  { code: { contains: search, mode: "insensitive" } },
                ],
              }
            : {},
          roomId ? { roomId } : {},
        ],
      },
      include: { linkedSupplies: { include: { equipmentSupply: true } }, room: true },
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
      include: { linkedSupplies: { include: { equipmentSupply: true } }, usages: true, room: true },
    });
    if (!equipment) return res.status(404).json({ error: "Equipo no encontrado" });
    res.json(equipment);
  })
);

const linkedSupplySchema = z.object({
  equipmentSupplyId: z.string().min(1),
  minThreshold: z.number().int().min(0).default(0),
  maxThreshold: z.number().int().min(0).optional(),
  autoDiscount: z.boolean().default(false),
});

const equipmentSchema = z.object({
  code: z.string().min(1).optional(),
  serial: z.string().optional(),
  name: z.string().min(1),
  category: z.string().min(1).default("General"),
  quantity: z.number().int().min(1).default(1),
  roomId: z.string().min(1),
  status: z.enum(["GOOD", "BAD"]).default("GOOD"),
  utility: z.enum(["HIGH", "MEDIUM", "LOW"]).default("MEDIUM"),
  unitValue: z.number().min(0).default(0),
  linkedSupplies: z.array(linkedSupplySchema).default([]),
});

function generateEquipmentCode() {
  return `EQ-${Date.now().toString(36).toUpperCase()}`;
}

equipmentRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = equipmentSchema.parse(req.body);
    const { linkedSupplies, ...rest } = data;

    const equipment = await prisma.equipment.create({
      data: {
        ...rest,
        code: rest.code ?? generateEquipmentCode(),
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
