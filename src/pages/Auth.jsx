import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, User as UserIcon, ArrowLeft } from "lucide-react";
import BrandMark from "@/components/BrandMark";
import GoogleIcon from "@/components/GoogleIcon";
import AuvanceFooter from "@/components/AuvanceFooter";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/lib/AuthContext";
import { safeReturnTo } from "@/lib/authReturnTo";
import { cn } from "@/lib/utils";

const PESTANAS = [
  { valor: "login", label: "Iniciar Sesión" },
  { valor: "registro", label: "Registrarse" },
];

export default function Auth() {
  const [modo, setModo] = useState("login");
  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [codigo, setCodigo] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  const returnTo = safeReturnTo();
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

  const registrar = async (e) => {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("La contraseña debe tener al menos 6 caracteres");
      return;
    }
    setCargando(true);
    try {
      await base44.auth.register({ email, password });
      setModo("codigo");
      setCodigo("");
      toast({ title: "¡Registro exitoso!", description: "Te enviamos un código de verificación a tu email." });
    } catch (err) {
      const mensaje = String(err?.message || "");
      setError(/exist|already|registrad/i.test(mensaje) ? "Este email ya está registrado" : mensaje || "No pudimos completar el registro");
    } finally {
      setCargando(false);
    }
  };

  const verificar = async (e) => {
    e.preventDefault();
    setError("");
    setCargando(true);
    try {
      const res = await base44.auth.verifyOtp({ email, otpCode: codigo });
      const token = res?.access_token || res?.accessToken;
      if (token) base44.auth.setToken(token);
      if (nombre.trim()) {
        try {
          await base44.auth.updateMe({ nombre_completo: nombre.trim() });
        } catch (err) {
          // el nombre se puede completar más tarde desde el sistema
        }
      }
      toast({ title: "¡Registro exitoso!" });
      window.location.href = destino;
    } catch (err) {
      setError("El código es incorrecto o venció");
      setCargando(false);
    }
  };

  const reenviar = async () => {
    await base44.auth.resendOtp(email);
    toast({ title: "Código reenviado", description: "Revisá tu casilla de email." });
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
            <p className="mt-1 text-sm text-muted-foreground">Iniciá sesión o creá una cuenta para continuar</p>

            {modo !== "codigo" && (
              <>
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

                <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
                  {PESTANAS.map((p) => (
                    <button
                      key={p.valor}
                      type="button"
                      onClick={() => {
                        setModo(p.valor);
                        setError("");
                      }}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        modo === p.valor ? "bg-card text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {error && (
              <div className="mb-4 rounded-xl bg-destructive/10 px-3 py-2.5 text-sm text-destructive">{error}</div>
            )}

            {modo === "login" && (
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
            )}

            {modo === "registro" && (
              <form onSubmit={registrar} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="reg-nombre">Nombre completo</Label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reg-nombre"
                      required
                      placeholder="Dr. Juan Pérez"
                      value={nombre}
                      onChange={(e) => setNombre(e.target.value)}
                      className="h-12 pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reg-email"
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
                  <Label htmlFor="reg-password">Contraseña</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="reg-password"
                      type="password"
                      required
                      minLength={6}
                      autoComplete="new-password"
                      placeholder="Mínimo 6 caracteres"
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
                      Creando cuenta...
                    </>
                  ) : (
                    "Registrarse"
                  )}
                </Button>
              </form>
            )}

            {modo === "codigo" && (
              <form onSubmit={verificar} className="mt-6 space-y-4">
                <p className="text-sm text-muted-foreground">
                  Enviamos un código de verificación a <span className="font-medium text-foreground">{email}</span>.
                </p>
                <div className="space-y-2">
                  <Label htmlFor="otp">Código de verificación</Label>
                  <Input
                    id="otp"
                    inputMode="numeric"
                    required
                    autoFocus
                    placeholder="000000"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value)}
                    className="h-12 text-center text-lg tracking-[.4em]"
                  />
                </div>
                <Button type="submit" disabled={cargando} className="btn-gradient h-12 w-full text-sm font-semibold">
                  {cargando ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    "Verificar y continuar"
                  )}
                </Button>
                <div className="flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setModo("registro");
                      setError("");
                    }}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-3 w-3" />
                    Volver
                  </button>
                  <button type="button" onClick={reenviar} className="text-primary hover:underline">
                    Reenviar código
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      <AuvanceFooter />
    </div>
  );
}