import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock } from "lucide-react";
import { useAuth } from "../lib/auth";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
      navigate("/");
    } catch {
      setError("Credenciales inválidas. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-4">
      <div className="w-full max-w-md rounded-lg border border-outline-variant bg-surface-lowest p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-on-surface">Bienvenido de Vuelta</h1>
        <p className="mt-1 text-sm text-on-surface-variant">
          Inicia sesión para gestionar tu inventario académico.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-semibold text-on-surface">
              Correo Institucional
            </label>
            <div className="flex items-center gap-2 rounded-md border border-outline-variant px-3 py-2 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/30">
              <Mail size={18} className="text-on-surface-variant" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="usuario@universidad.edu"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-on-surface">
              Contraseña
            </label>
            <div className="flex items-center gap-2 rounded-md border border-outline-variant px-3 py-2 focus-within:border-secondary focus-within:ring-2 focus-within:ring-secondary/30">
              <Lock size={18} className="text-on-surface-variant" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-sm outline-none"
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-md bg-secondary px-4 py-2 text-sm font-semibold text-on-secondary transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {loading ? "Ingresando..." : "Iniciar Sesión"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-on-surface-variant">
          ¿No tienes cuenta?{" "}
          <Link to="/registro" className="font-semibold text-secondary hover:underline">
            Crear Perfil Académico
          </Link>
        </p>
      </div>
    </div>
  );
}
