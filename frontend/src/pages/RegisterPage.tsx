import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    department: "",
    role: "PROFESSOR" as "ADMIN" | "PROFESSOR",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (form.password !== form.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return;
    }

    setLoading(true);
    try {
      await register({
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        password: form.password,
        role: form.role,
        department: form.department || undefined,
      });
      navigate("/");
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        "No se pudo crear el perfil";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4 py-10">
      <div className="w-full max-w-lg rounded-lg border border-outline-variant bg-surface-lowest p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-on-surface">Crear Perfil Académico</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Regístrate para acceder al Sistema de Inventario Académico.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nombre">
              <input
                required
                value={form.firstName}
                onChange={(e) => update("firstName", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Apellido">
              <input
                required
                value={form.lastName}
                onChange={(e) => update("lastName", e.target.value)}
                className="input"
              />
            </Field>
          </div>

          <Field label="Correo Institucional">
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="jane.doe@universidad.edu"
              className="input"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Rol Académico">
              <select
                value={form.role}
                onChange={(e) => update("role", e.target.value as "ADMIN" | "PROFESSOR")}
                className="input"
              >
                <option value="PROFESSOR">Profesor</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </Field>
            <Field label="Departamento">
              <input
                value={form.department}
                onChange={(e) => update("department", e.target.value)}
                placeholder="Ej. Química"
                className="input"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Contraseña">
              <input
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="input"
              />
            </Field>
            <Field label="Confirmar Contraseña">
              <input
                type="password"
                required
                value={form.confirmPassword}
                onChange={(e) => update("confirmPassword", e.target.value)}
                className="input"
              />
            </Field>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <Link
              to="/login"
              className="rounded-md border border-outline-variant px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary hover:opacity-90 disabled:opacity-60"
            >
              {loading ? "Creando..." : "Crear Perfil"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-semibold text-on-surface">{label}</span>
      {children}
    </label>
  );
}
