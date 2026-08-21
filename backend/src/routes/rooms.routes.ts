import { Router } from "express";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const roomsRouter = Router();
roomsRouter.use(requireAuth);

roomsRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const rooms = await prisma.room.findMany({
      orderBy: { order: "asc" },
      include: { _count: { select: { equipment: true } } },
    });
    res.json(rooms);
  })
);

roomsRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const room = await prisma.room.findUnique({ where: { id: req.params.id } });
    if (!room) return res.status(404).json({ error: "Sala no encontrada" });
    res.json(room);
  })
);
