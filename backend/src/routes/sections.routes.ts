import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";
import { syncPreliminaryPurchaseOrder } from "../lib/purchaseOrderSync";

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
        equipmentUsages: {
          include: { equipment: true, equipmentSupply: true },
          orderBy: { usedAt: "desc" },
        },
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

const duplicateSchema = z.object({ code: z.string().min(1).optional() });

sectionsRouter.post(
  "/:id/duplicate",
  asyncHandler(async (req, res) => {
    const data = duplicateSchema.parse(req.body ?? {});
    const sourceId = req.params.id;

    const newSection = await prisma.$transaction(async (tx) => {
      const source = await tx.section.findUnique({
        where: { id: sourceId },
        include: { consumptionRecords: true, equipmentUsages: true },
      });
      if (!source) return null;

      const created = await tx.section.create({
        data: {
          workshopId: source.workshopId,
          code: data.code ?? `${source.code} (Copia)`,
          year: source.year,
          semester: source.semester,
          dayOfWeek: source.dayOfWeek ?? undefined,
          startTime: source.startTime ?? undefined,
          endTime: source.endTime ?? undefined,
          location: source.location ?? undefined,
          studentsCount: source.studentsCount,
          professorId: source.professorId ?? undefined,
        },
      });

      const affectedSupplyIds = new Set<string>();

      for (const record of source.consumptionRecords) {
        await tx.consumptionRecord.create({
          data: {
            sectionId: created.id,
            supplyId: record.supplyId,
            requiredQty: record.requiredQty,
            usedQty: record.usedQty,
            wasteQty: record.wasteQty,
            reusedQty: record.reusedQty,
            discardedQty: record.discardedQty,
            instructorNotes: record.instructorNotes ?? undefined,
            reportedByUserId: req.auth?.userId,
          },
        });
        await tx.supply.update({
          where: { id: record.supplyId },
          data: {
            currentStock: { increment: Number(record.reusedQty) - Number(record.usedQty) },
            newStock: { decrement: Number(record.usedQty) },
            reusableStock: { increment: Number(record.reusedQty) },
          },
        });
        affectedSupplyIds.add(record.supplyId);
      }

      for (const usage of source.equipmentUsages) {
        await tx.equipmentUsage.create({
          data: {
            sectionId: created.id,
            equipmentId: usage.equipmentId,
            equipmentSupplyId: usage.equipmentSupplyId,
            usedQty: usage.usedQty,
            reusedQty: usage.reusedQty,
            discardedQty: usage.discardedQty,
          },
        });
        if (usage.equipmentSupplyId) {
          await tx.equipmentSupply.update({
            where: { id: usage.equipmentSupplyId },
            data: {
              currentStock: { increment: Number(usage.reusedQty) - Number(usage.usedQty) },
              newStock: { decrement: Number(usage.usedQty) },
              reusableStock: { increment: Number(usage.reusedQty) },
            },
          });
        }
      }

      for (const supplyId of affectedSupplyIds) {
        await syncPreliminaryPurchaseOrder(tx, supplyId);
      }

      return tx.section.findUnique({
        where: { id: created.id },
        include: {
          professor: true,
          consumptionRecords: { include: { supply: true } },
          equipmentUsages: { include: { equipment: true, equipmentSupply: true } },
        },
      });
    });

    if (!newSection) return res.status(404).json({ error: "Sección no encontrada" });
    res.status(201).json(newSection);
  })
);

const consumptionSchema = z.object({
  supplyId: z.string().min(1),
  requiredQty: z.number().min(0),
  usedQty: z.number().min(0),
  wasteQty: z.number().min(0).default(0),
  reusedQty: z.number().min(0).default(0),
  discardedQty: z.number().min(0).default(0),
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

      await tx.supply.update({
        where: { id: data.supplyId },
        data: {
          currentStock: { increment: data.reusedQty - data.usedQty },
          newStock: { decrement: data.usedQty },
          reusableStock: { increment: data.reusedQty },
        },
      });

      await syncPreliminaryPurchaseOrder(tx, data.supplyId);

      return created;
    });

    res.status(201).json(record);
  })
);

const consumptionUpdateSchema = z.object({
  requiredQty: z.number().min(0).optional(),
  usedQty: z.number().min(0).optional(),
  wasteQty: z.number().min(0).optional(),
  reusedQty: z.number().min(0).optional(),
  discardedQty: z.number().min(0).optional(),
  instructorNotes: z.string().optional(),
});

sectionsRouter.patch(
  "/:sectionId/consumption/:recordId",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = consumptionUpdateSchema.parse(req.body);
    const { recordId } = req.params;

    const record = await prisma.$transaction(async (tx) => {
      const existing = await tx.consumptionRecord.findUnique({ where: { id: recordId } });
      if (!existing) return null;

      const oldUsedQty = Number(existing.usedQty);
      const oldReusedQty = Number(existing.reusedQty);
      const newUsedQty = data.usedQty ?? oldUsedQty;
      const newReusedQty = data.reusedQty ?? oldReusedQty;

      await tx.supply.update({
        where: { id: existing.supplyId },
        data: {
          currentStock: { increment: newReusedQty - newUsedQty - (oldReusedQty - oldUsedQty) },
          newStock: { decrement: newUsedQty - oldUsedQty },
          reusableStock: { increment: newReusedQty - oldReusedQty },
        },
      });

      const updated = await tx.consumptionRecord.update({
        where: { id: recordId },
        data,
        include: { supply: true },
      });

      await syncPreliminaryPurchaseOrder(tx, existing.supplyId);
      return updated;
    });

    if (!record) return res.status(404).json({ error: "Ajuste no encontrado" });
    res.json(record);
  })
);

sectionsRouter.delete(
  "/:sectionId/consumption/:recordId",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { recordId } = req.params;

    const found = await prisma.$transaction(async (tx) => {
      const existing = await tx.consumptionRecord.findUnique({ where: { id: recordId } });
      if (!existing) return false;

      await tx.supply.update({
        where: { id: existing.supplyId },
        data: {
          currentStock: { increment: Number(existing.usedQty) - Number(existing.reusedQty) },
          newStock: { increment: Number(existing.usedQty) },
          reusableStock: { decrement: Number(existing.reusedQty) },
        },
      });

      await tx.consumptionRecord.delete({ where: { id: recordId } });
      await syncPreliminaryPurchaseOrder(tx, existing.supplyId);
      return true;
    });

    if (!found) return res.status(404).json({ error: "Ajuste no encontrado" });
    res.status(204).send();
  })
);

const equipmentUsageSchema = z.object({
  equipmentId: z.string().min(1),
  equipmentSupplyId: z.string().min(1).optional(),
  usedQty: z.number().min(0),
  reusedQty: z.number().min(0).default(0),
  discardedQty: z.number().min(0).default(0),
});

sectionsRouter.post(
  "/:id/equipment-usage",
  asyncHandler(async (req, res) => {
    const data = equipmentUsageSchema.parse(req.body);
    const sectionId = req.params.id;

    const usage = await prisma.$transaction(async (tx) => {
      const created = await tx.equipmentUsage.create({
        data: { ...data, sectionId },
        include: { equipment: true, equipmentSupply: true },
      });

      if (data.equipmentSupplyId) {
        await tx.equipmentSupply.update({
          where: { id: data.equipmentSupplyId },
          data: {
            currentStock: { increment: data.reusedQty - data.usedQty },
            newStock: { decrement: data.usedQty },
            reusableStock: { increment: data.reusedQty },
          },
        });
      }

      return created;
    });

    res.status(201).json(usage);
  })
);

const equipmentUsageUpdateSchema = z.object({
  usedQty: z.number().min(0).optional(),
  reusedQty: z.number().min(0).optional(),
  discardedQty: z.number().min(0).optional(),
});

sectionsRouter.patch(
  "/:sectionId/equipment-usage/:usageId",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const data = equipmentUsageUpdateSchema.parse(req.body);
    const { usageId } = req.params;

    const usage = await prisma.$transaction(async (tx) => {
      const existing = await tx.equipmentUsage.findUnique({ where: { id: usageId } });
      if (!existing) return null;

      if (existing.equipmentSupplyId) {
        const oldUsedQty = Number(existing.usedQty);
        const oldReusedQty = Number(existing.reusedQty);
        const newUsedQty = data.usedQty ?? oldUsedQty;
        const newReusedQty = data.reusedQty ?? oldReusedQty;

        await tx.equipmentSupply.update({
          where: { id: existing.equipmentSupplyId },
          data: {
            currentStock: { increment: newReusedQty - newUsedQty - (oldReusedQty - oldUsedQty) },
            newStock: { decrement: newUsedQty - oldUsedQty },
            reusableStock: { increment: newReusedQty - oldReusedQty },
          },
        });
      }

      const updated = await tx.equipmentUsage.update({
        where: { id: usageId },
        data,
        include: { equipment: true, equipmentSupply: true },
      });

      return updated;
    });

    if (!usage) return res.status(404).json({ error: "Uso de equipamiento no encontrado" });
    res.json(usage);
  })
);

sectionsRouter.delete(
  "/:sectionId/equipment-usage/:usageId",
  requireAdmin,
  asyncHandler(async (req, res) => {
    const { usageId } = req.params;

    const found = await prisma.$transaction(async (tx) => {
      const existing = await tx.equipmentUsage.findUnique({ where: { id: usageId } });
      if (!existing) return false;

      if (existing.equipmentSupplyId) {
        await tx.equipmentSupply.update({
          where: { id: existing.equipmentSupplyId },
          data: {
            currentStock: { increment: Number(existing.usedQty) - Number(existing.reusedQty) },
            newStock: { increment: Number(existing.usedQty) },
            reusableStock: { decrement: Number(existing.reusedQty) },
          },
        });
      }

      await tx.equipmentUsage.delete({ where: { id: usageId } });
      return true;
    });

    if (!found) return res.status(404).json({ error: "Uso de equipamiento no encontrado" });
    res.status(204).send();
  })
);
