import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const projectionsRouter = Router();
projectionsRouter.use(requireAuth);

projectionsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const now = new Date();
    const year = req.query.year ? Number(req.query.year) : now.getFullYear();
    const semester = req.query.semester ? Number(req.query.semester) : 1;

    const supplies = await prisma.supply.findMany({
      include: {
        // Only the same semester's historical pattern is used to project that
        // semester again — Primer/Segundo Semestre courses differ enough that
        // mixing their consumption history would skew the rate.
        consumptionRecords: {
          where: { section: { semester } },
          include: { section: { select: { studentsCount: true } } },
        },
        subjects: {
          include: {
            subject: {
              include: {
                workshops: {
                  include: {
                    sections: { where: { year, semester }, select: { studentsCount: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    const items = supplies.map((supply) => {
      let totalRequiredHistorical = 0;
      let totalStudentsHistorical = 0;
      for (const record of supply.consumptionRecords) {
        if (record.section.studentsCount > 0) {
          totalRequiredHistorical += Number(record.requiredQty);
          totalStudentsHistorical += record.section.studentsCount;
        }
      }
      const ratePerStudent =
        totalStudentsHistorical > 0 ? totalRequiredHistorical / totalStudentsHistorical : 0;

      const upcomingStudents = supply.subjects.reduce((sum, { subject }) => {
        return (
          sum +
          subject.workshops.reduce(
            (wSum, w) => wSum + w.sections.reduce((sSum, s) => sSum + s.studentsCount, 0),
            0
          )
        );
      }, 0);

      const basedOnHistoricalData = ratePerStudent > 0 && upcomingStudents > 0;
      const projectedNeed = basedOnHistoricalData
        ? Math.ceil(ratePerStudent * upcomingStudents)
        : supply.minStock * 2;

      const diff = supply.currentStock - projectedNeed;

      let status: "CRITICO" | "ATENCION" | "SUFICIENTE" = "SUFICIENTE";
      if (diff < 0 && Math.abs(diff) >= supply.minStock) status = "CRITICO";
      else if (diff < 0) status = "ATENCION";

      const estimatedCost = diff < 0 ? Math.abs(diff) * Number(supply.unitValue) : 0;

      return {
        id: supply.id,
        sku: supply.sku,
        name: supply.name,
        category: supply.category,
        currentStock: supply.currentStock,
        projectedNeed,
        diff,
        status,
        estimatedCost,
        upcomingStudents,
        basedOnHistoricalData,
      };
    });

    const criticalCount = items.filter((i) => i.status === "CRITICO").length;
    const totalEstimatedCost = items.reduce((sum, i) => sum + i.estimatedCost, 0);

    res.json({ items, criticalCount, totalEstimatedCost, year, semester });
  })
);

const futureNeedSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  estimatedQty: z.number().int().min(0),
  requiredDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]).default("MEDIUM"),
  status: z.enum(["PENDING", "IN_PROGRESS"]).optional(),
});

const FUTURE_NEED_SORTABLE_FIELDS = ["name", "estimatedQty", "priority", "createdAt"];

projectionsRouter.get(
  "/future-needs",
  asyncHandler(async (req, res) => {
    const { sortBy = "createdAt", sortDir = "desc" } = req.query as Record<string, string>;
    const orderField = FUTURE_NEED_SORTABLE_FIELDS.includes(sortBy) ? sortBy : "createdAt";
    const orderDir = sortDir === "asc" ? "asc" : "desc";

    const needs = await prisma.futureSupplyNeed.findMany({ orderBy: { [orderField]: orderDir } });
    res.json(needs);
  })
);

projectionsRouter.post(
  "/future-needs",
  asyncHandler(async (req, res) => {
    const data = futureNeedSchema.parse(req.body);
    const need = await prisma.futureSupplyNeed.create({
      data: { ...data, requiredDate: data.requiredDate ? new Date(data.requiredDate) : undefined },
    });
    res.status(201).json(need);
  })
);

projectionsRouter.patch(
  "/future-needs/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = futureNeedSchema.partial().parse(req.body);
    const need = await prisma.futureSupplyNeed.update({
      where: { id: req.params.id },
      data: { ...data, requiredDate: data.requiredDate ? new Date(data.requiredDate) : undefined },
    });
    res.json(need);
  })
);

projectionsRouter.delete(
  "/future-needs/:id",
  requireAdmin,
  asyncHandler(async (req, res) => {
    await prisma.futureSupplyNeed.delete({ where: { id: req.params.id } });
    res.status(204).send();
  })
);
