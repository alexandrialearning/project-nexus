import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Eye, EyeOff } from "lucide-react";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendEmailVerification, signOut, onAuthStateChanged } from "firebase/auth";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import Chat from "./Chat"; // Interface de Streamlit importada

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState<any>(null); // Guardar estado del usuario validado

  // El "Vigilante" (Portero) que revisa si ya iniciamos sesión
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser && currentUser.emailVerified) {
        setUser(currentUser); // ¡Deja pasar al usuario!
      } else {
        setUser(null); // Lo mantiene en la pantalla de Login
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          toast.error("Tu correo aún no está verificado. Por favor revisa tu bandeja de entrada.");
          return; // Lo saca inmediatamente
        }
        toast.success("¡Bienvenido de vuelta a Alexandr.ia!");
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        toast.success("Cuenta creada. Hemos enviado un correo de verificación. Confírmalo antes de entrar.");
        setIsLogin(true);
      }
    } catch (error: any) {
      if (error.code === 'auth/invalid-credential') {
        toast.error("Correo o contraseña incorrectos.");
      } else if (error.code === 'auth/email-already-in-use') {
        toast.error("Este correo ya está registrado.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Si el usuario pasó al portero (está validado), SE MUESTRA EL CHAT DE STREAMLIT ✨🏁🚀
  if (user) {
    return <Chat user={user} />;
  }

  // De lo contrario, se queda en el Login
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      {/* Subtle grid overlay */}
      <div
        className="pointer-events-none fixed inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(hsl(215 15% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(215 15% 50%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }}
      />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Brand */}
        <div className="mb-12 flex flex-col items-center">
          <img src={logo} alt="Alexandr.ia" className="h-60 w-auto" />
          <p className="-mt-6 font-mono text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
            Scroll_v2
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleAuth}
          className="space-y-5"
        >
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              className="focus:border-[#80E0BE]"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="focus:border-[#80E0BE]"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                disabled={loading}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button 
            type="submit" 
            disabled={loading}
            style={{ backgroundColor: '#80E0BE', color: '#000' }}
            className="w-full h-12 gap-2.5 hover:opacity-90 transition-opacity"
          >
            <KeyRound size={14} />
            {loading ? "Cargando..." : (isLogin ? "Iniciar sesión" : "Crear cuenta")}
          </Button>
        </form>

        {/* Toggle */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {isLogin ? "¿No tienes cuenta?" : "¿Ya tienes cuenta?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#80E0BE' }}
            className="hover:opacity-80 transition-colors underline underline-offset-4"
          >
            {isLogin ? "Regístrate" : "Entrar"}
          </button>
        </p>

        {/* Footer accent */}
        <div className="mt-16 flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-border" />
          <span className="font-mono text-[9px] tracking-[0.4em] text-muted-foreground uppercase">
            Human · Centered · Protocol
          </span>
          <div className="h-px w-8 bg-border" />
        </div>
      </div>
    </div>
  );
};

export default Index;
