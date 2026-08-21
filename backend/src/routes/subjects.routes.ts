import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const subjectsRouter = Router();
subjectsRouter.use(requireAuth);

subjectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { year, semester } = req.query as Record<string, string>;

    const subjects = await prisma.subject.findMany({
      where: year && semester ? { year: Number(year), semester: Number(semester) } : undefined,
      orderBy: { name: "asc" },
      include: {
        workshops: { include: { professor: true, sections: true }, orderBy: { order: "asc" } },
        supplies: { include: { supply: true } },
      },
    });

    const result = subjects.map((subject) => {
      const sections = subject.workshops.flatMap((w) => w.sections);
      const studentsCount = sections.reduce((sum, s) => sum + s.studentsCount, 0);
      const professor = subject.workshops.find((w) => w.professor)?.professor ?? null;
      const criticalSupply = subject.supplies.some(
        ({ supply }) => supply.currentStock < supply.minStock
      );

      return {
        id: subject.id,
        name: subject.name,
        code: subject.code,
        category: subject.category,
        icon: subject.icon,
        year: subject.year,
        semester: subject.semester,
        workshopsCount: subject.workshops.length,
        studentsCount,
        professor: professor ? `${professor.firstName} ${professor.lastName}` : null,
        stockStatus: criticalSupply ? "ALERTA" : "NORMAL",
      };
    });

    res.json(result);
  })
);

subjectsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const subject = await prisma.subject.findUnique({
      where: { id: req.params.id },
      include: {
        workshops: {
          include: { professor: true, sections: true },
          orderBy: { order: "asc" },
        },
      },
    });
    if (!subject) return res.status(404).json({ error: "Asignatura no encontrada" });
    res.json(subject);
  })
);

const subjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  category: z.string().min(1),
  icon: z.string().optional(),
  year: z.number().int(),
  semester: z.number().int().min(1).max(2),
});

subjectsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = subjectSchema.parse(req.body);
    const subject = await prisma.subject.create({ data });
    res.status(201).json(subject);
  })
);

subjectsRouter.patch(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = subjectSchema.partial().parse(req.body);
    const subject = await prisma.subject.update({ where: { id: req.params.id }, data });
    res.json(subject);
  })
);

subjectsRouter.delete(
  "/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.subject.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
