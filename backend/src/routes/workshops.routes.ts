import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const workshopsRouter = Router();
workshopsRouter.use(requireAuth);

workshopsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const workshop = await prisma.workshop.findUnique({
      where: { id: req.params.id },
      include: {
        subject: true,
        professor: true,
        sections: {
          include: { professor: true, consumptionRecords: true },
          orderBy: { code: "asc" },
        },
      },
    });
    if (!workshop) return res.status(404).json({ error: "Taller no encontrado" });
    res.json(workshop);
  })
);

const workshopSchema = z.object({
  subjectId: z.string().min(1),
  code: z.string().min(1),
  name: z.string().min(1),
  professorId: z.string().optional(),
});

workshopsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = workshopSchema.parse(req.body);
    const workshop = await prisma.workshop.create({ data });
    res.status(201).json(workshop);
  })
);

workshopsRouter.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = workshopSchema.partial().parse(req.body);
    const workshop = await prisma.workshop.update({ where: { id: req.params.id }, data });
    res.json(workshop);
  })
);

workshopsRouter.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.workshop.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
