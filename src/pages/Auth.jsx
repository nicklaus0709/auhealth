import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import GoogleIcon from "@/components/GoogleIcon";
import AuvanceFooter from "@/components/AuvanceFooter";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo } from "@/lib/authReturnTo";

// El acceso es sólo por invitación: las cuentas las crea un administrador desde "Usuarios".
export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const returnTo = safeReturnTo();
  const porInactividad = new URLSearchParams(window.location.search).get("motivo") === "inactividad";
  const destino = returnTo !== "/" ? returnTo : "/dashboard";

  if (isAuthenticated) return <Navigate to={destino} replace />;

  const entrar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      await base44.auth.loginViaEmailPassword(email, password);
      toast({ title: "¡Bienvenido!" });
      window.location.href = destino;
    } catch (err) {
      setError("Email o contraseña incorrectos");
      setCargando(false);
    }
  };

  const conGoogle = () => base44.auth.loginWithProvider("google", destino);

  return (
    <div className="app-surface-bg flex min-h-screen flex-col">
      <div className="relative flex flex-1 items-center justify-center px-4 py-12">
        <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-teal/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-brand-emerald/15 blur-3xl" />

        <div className="animate-scale-in relative z-10 w-full max-w-md">
          <div className="flex flex-col items-center text-center">
            <BrandMark iconSize={56} />
            <span className="text-gradient-teal mt-4 font-heading text-3xl font-extrabold tracking-tight">AuHealth</span>
            <p className="mt-1 text-sm text-muted-foreground">Gestión Médica Integral</p>
          </div>

          <div className="glass mt-8 rounded-2xl border border-white/60 p-6 shadow-soft sm:p-8">
            <h1 className="font-heading text-xl font-bold text-foreground">Acceso al Sistema</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Iniciá sesión con la cuenta que te asignó el consultorio
            </p>

            <Button type="button" variant="outline" onClick={conGoogle} className="mt-6 h-12 w-full bg-card text-sm font-medium">
              <GoogleIcon className="mr-2 h-5 w-5" />
              Continuar con Google
            </Button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center">
                <span className="rounded-full bg-white px-3 text-xs text-muted-foreground">o con email</span>
              </div>
            </div>

            {porInactividad && !error && (
              <div className="mb-4 rounded-xl bg-brand-blue/10 px-3 py-2.5 text-sm text-brand-blue-700">
                Cerramos tu sesión por inactividad para proteger los datos de los pacientes.
              </div>
            )}

            {error && (
              <div className="mb-4 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</div>
            )}

            <form onSubmit={entrar} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="medico@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="login-password">Contraseña</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="login-password"
                    type="password"
                    required
                    autoComplete="current-password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 pl-10"
                  />
                </div>
              </div>
              <Button type="submit" disabled={cargando} className="btn-gradient h-12 w-full text-sm font-semibold">
                {cargando ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Ingresando...
                  </>
                ) : (
                  "Iniciar Sesión"
                )}
              </Button>
            </form>
          </div>
        </div>
      </div>

      <AuvanceFooter />
    </div>
  );
}