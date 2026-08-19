import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const subjectsRouter = Router();
subjectsRouter.use(requireAuth);

subjectsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { year, semester } = req.query as Record<string, string>;

    const subjects = await prisma.subject.findMany({
      orderBy: { name: "asc" },
      include: {
        workshops: {
          include: {
            professor: true,
            sections:
              year && semester
                ? { where: { year: Number(year), semester: Number(semester) } }
                : true,
          },
        },
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
});

subjectsRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = subjectSchema.parse(req.body);
    const subject = await prisma.subject.create({ data });
    res.status(201).json(subject);
  })
);
