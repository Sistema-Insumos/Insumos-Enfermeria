import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const sectionsRouter = Router();
sectionsRouter.use(requireAuth);

sectionsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const section = await prisma.section.findUnique({
      where: { id: req.params.id },
      include: {
        professor: true,
        workshop: { include: { subject: true } },
        consumptionRecords: { include: { supply: true }, orderBy: { reportedAt: "desc" } },
      },
    });
    if (!section) return res.status(404).json({ error: "Sección no encontrada" });
    res.json(section);
  })
);

const sectionSchema = z.object({
  workshopId: z.string().min(1),
  code: z.string().min(1),
  year: z.number().int(),
  semester: z.number().int().min(1).max(2),
  dayOfWeek: z.string().optional(),
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  studentsCount: z.number().int().min(0).default(0),
  professorId: z.string().optional(),
});

sectionsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = sectionSchema.parse(req.body);
    const section = await prisma.section.create({ data });
    res.status(201).json(section);
  })
);

sectionsRouter.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = sectionSchema.partial().parse(req.body);
    const section = await prisma.section.update({ where: { id: req.params.id }, data });
    res.json(section);
  })
);

sectionsRouter.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.section.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);

const consumptionSchema = z.object({
  supplyId: z.string().min(1),
  requiredQty: z.number().min(0),
  usedQty: z.number().min(0),
  wasteQty: z.number().min(0).default(0),
  postClassAction: z.enum(["DISCARD", "REUSE"]).optional(),
  reuseQty: z.number().min(0).optional(),
  instructorNotes: z.string().optional(),
});

sectionsRouter.post(
  "/:id/consumption",
  asyncHandler(async (req, res) => {
    const data = consumptionSchema.parse(req.body);
    const sectionId = req.params.id;

    const record = await prisma.$transaction(async (tx) => {
      const created = await tx.consumptionRecord.create({
        data: { ...data, sectionId, reportedByUserId: req.auth?.userId },
      });

      const reuseQty = data.postClassAction === "REUSE" ? data.reuseQty ?? 0 : 0;
      await tx.supply.update({
        where: { id: data.supplyId },
        data: {
          currentStock: { increment: reuseQty - data.usedQty },
          reusableStock: { increment: reuseQty },
        },
      });

      return created;
    });

    res.status(201).json(record);
  })
);
