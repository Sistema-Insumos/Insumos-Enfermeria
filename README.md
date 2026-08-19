# Sistema de Inventario Académico

App web para gestionar inventario de insumos académicos (laboratorios, talleres, equipamiento).

## Estructura

- `backend/` — API REST (Node + Express + TypeScript + Prisma + PostgreSQL)
- `frontend/` — SPA (React + Vite + TypeScript + Tailwind)
- `Mockups/` — Diseños originales de referencia

## Desarrollo local

1. Backend:
   ```
   cd backend
   npm install
   cp .env.example .env   # completar DATABASE_URL y JWT_SECRET
   npx prisma migrate dev
   npm run dev
   ```
2. Frontend:
   ```
   cd frontend
   npm install
   cp .env.example .env   # VITE_API_URL apuntando al backend
   npm run dev
   ```

## Despliegue

- **Base de datos**: PostgreSQL gratuito en [Neon](https://neon.tech)
- **Backend**: [Render](https://render.com) — usa el `render.yaml` en la raíz del repo (Blueprint). Variables de entorno a configurar: `DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN` (URL del frontend en Vercel)
- **Frontend**: [Vercel](https://vercel.com) — importar el repo, Root Directory = `frontend`. Variable de entorno: `VITE_API_URL` (URL del backend en Render)
