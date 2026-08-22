import "dotenv/config";
import cors from "cors";
import express, { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { authRouter } from "./routes/auth.routes";
import { suppliesRouter } from "./routes/supplies.routes";
import { subjectsRouter } from "./routes/subjects.routes";
import { workshopsRouter } from "./routes/workshops.routes";
import { sectionsRouter } from "./routes/sections.routes";
import { equipmentRouter } from "./routes/equipment.routes";
import { roomsRouter } from "./routes/rooms.routes";
import { equipmentSuppliesRouter } from "./routes/equipmentSupplies.routes";
import { projectionsRouter } from "./routes/projections.routes";
import { suppliersRouter } from "./routes/suppliers.routes";
import { purchaseOrdersRouter } from "./routes/purchaseOrders.routes";
import { dashboardRouter } from "./routes/dashboard.routes";
import { reportsRouter } from "./routes/reports.routes";

const app = express();

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? "*" }));
app.use(express.json());

app.get("/health", (_req, res) => res.json({ status: "ok" }));

app.use("/api/auth", authRouter);
app.use("/api/supplies", suppliesRouter);
app.use("/api/subjects", subjectsRouter);
app.use("/api/workshops", workshopsRouter);
app.use("/api/sections", sectionsRouter);
app.use("/api/equipment", equipmentRouter);
app.use("/api/rooms", roomsRouter);
app.use("/api/equipment-supplies", equipmentSuppliesRouter);
app.use("/api/projections", projectionsRouter);
app.use("/api/suppliers", suppliersRouter);
app.use("/api/purchase-orders", purchaseOrdersRouter);
app.use("/api/dashboard", dashboardRouter);
app.use("/api/reports", reportsRouter);

app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: "Datos inválidos", details: err.flatten() });
  }
  console.error(err);
  res.status(500).json({ error: "Error interno del servidor" });
});

const port = Number(process.env.PORT) || 4000;
app.listen(port, () => {
  console.log(`Backend escuchando en http://localhost:${port}`);
});
