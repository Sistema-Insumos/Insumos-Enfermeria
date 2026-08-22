import { Router } from "express";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { requireAuth } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const purchaseOrdersRouter = Router();
purchaseOrdersRouter.use(requireAuth);

purchaseOrdersRouter.get(
  "/",
  asyncHandler(async (_req, res) => {
    const orders = await prisma.purchaseOrder.findMany({
      include: {
        items: { include: { supply: true } },
        quotes: { include: { supplier: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(orders);
  })
);

const orderSchema = z.object({
  items: z
    .array(
      z.object({
        supplyId: z.string().min(1),
        quantity: z.number().int().min(1),
        estimatedCost: z.number().min(0),
      })
    )
    .min(1),
});

purchaseOrdersRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const data = orderSchema.parse(req.body);
    const order = await prisma.purchaseOrder.create({
      data: { items: { create: data.items } },
      include: { items: { include: { supply: true } } },
    });
    res.status(201).json(order);
  })
);

const projectionItemSchema = z.object({
  supplyId: z.string().min(1),
  quantity: z.number().int().min(1),
  estimatedCost: z.number().min(0),
});

purchaseOrdersRouter.post(
  "/projection-items",
  asyncHandler(async (req, res) => {
    const data = projectionItemSchema.parse(req.body);

    const order = await prisma.$transaction(async (tx) => {
      let cart = await tx.purchaseOrder.findFirst({
        where: { fromProjection: true, status: "DRAFT" },
      });
      if (!cart) {
        cart = await tx.purchaseOrder.create({ data: { fromProjection: true } });
      }

      await tx.purchaseOrderItem.upsert({
        where: { purchaseOrderId_supplyId: { purchaseOrderId: cart.id, supplyId: data.supplyId } },
        create: {
          purchaseOrderId: cart.id,
          supplyId: data.supplyId,
          quantity: data.quantity,
          estimatedCost: data.estimatedCost,
        },
        update: { quantity: data.quantity, estimatedCost: data.estimatedCost },
      });

      return tx.purchaseOrder.findUnique({
        where: { id: cart.id },
        include: { items: { include: { supply: true } }, quotes: { include: { supplier: true } } },
      });
    });

    res.status(201).json(order);
  })
);

const quoteSchema = z.object({
  supplierId: z.string().min(1),
  subtotal: z.number().min(0),
  shipping: z.number().min(0).default(0),
  availability: z.string().optional(),
});

purchaseOrdersRouter.post(
  "/:id/quotes",
  asyncHandler(async (req, res) => {
    const data = quoteSchema.parse(req.body);
    const quote = await prisma.purchaseOrderQuote.create({
      data: {
        purchaseOrderId: req.params.id,
        supplierId: data.supplierId,
        subtotal: data.subtotal,
        shipping: data.shipping,
        total: data.subtotal + data.shipping,
        availability: data.availability,
      },
      include: { supplier: true },
    });
    res.status(201).json(quote);
  })
);

purchaseOrdersRouter.patch(
  "/:id/status",
  asyncHandler(async (req, res) => {
    const { status } = z
      .object({ status: z.enum(["DRAFT", "SENT", "RECEIVED", "CANCELLED"]) })
      .parse(req.body);
    const order = await prisma.purchaseOrder.update({
      where: { id: req.params.id },
      data: { status },
    });
    res.json(order);
  })
);
