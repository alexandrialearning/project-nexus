import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Eye, EyeOff, Mail, AlertTriangle } from "lucide-react";
import { auth } from "@/lib/firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import Chat from "./Chat";

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [debugError, setDebugError] = useState<string | null>(null);

  useEffect(() => {
    console.log("DEBUG: Iniciando monitoreo de Auth");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setInitializing(false);
      if (currentUser) {
        console.log("DEBUG: Usuario autenticado", currentUser.email);
        setUser(currentUser);
      } else {
        console.log("DEBUG: No hay sesión activa");
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setDebugError(null);
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          await signOut(auth);
          toast.error("Tu correo aún no está verificado.");
          return;
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await sendEmailVerification(userCredential.user);
        await signOut(auth);
        toast.success("Cuenta creada. Confirma el correo enviado.");
        setIsLogin(true);
      }
    } catch (error: any) {
      setDebugError(error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setDebugError(null);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      console.log("DEBUG: Google Login Exitoso", result.user.email);
      setUser(result.user);
    } catch (error: any) {
      console.error("DEBUG: Error Google", error);
      setDebugError("Error Google: " + error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setLoading(true);
    setDebugError(null);
    try {
      const provider = new OAuthProvider("microsoft.com");
      const result = await signInWithPopup(auth, provider);
      console.log("DEBUG: Microsoft Login Exitoso", result.user.email);
      setUser(result.user);
    } catch (error: any) {
      console.error("DEBUG: Error Microsoft", error);
      setDebugError("Error Microsoft: " + error.message);
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (initializing) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-zinc-950">
        <div className="text-[#80E0BE] animate-pulse font-mono text-xs uppercase tracking-[0.3em]">
          Conectando con Alexandria...
        </div>
      </div>
    );
  }

  if (user) {
    return <Chat user={user} />;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="pointer-events-none fixed inset-0 opacity-[0.03]" style={{ backgroundImage: "linear-gradient(hsl(215 15% 50%) 1px, transparent 1px), linear-gradient(90deg, hsl(215 15% 50%) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
      
      <div className="relative z-10 w-full max-w-sm">
        {debugError && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-3 items-center text-red-400 text-xs animate-in fade-in slide-in-from-top-4">
            <AlertTriangle className="shrink-0" size={16} />
            <p>{debugError}</p>
          </div>
        )}

        <div className="mb-12 flex flex-col items-center">
          <img src={logo} alt="Alexadr.ia" className="h-48 w-auto mb-4" />
          <p className="font-mono text-[10px] tracking-[0.4em] text-[#80E0BE] uppercase opacity-50">Scroll_v2 . Prod</p>
        </div>

        <div className="space-y-3 mb-8">
          <Button onClick={handleGoogleLogin} disabled={loading} variant="outline" className="w-full h-12 gap-3 border-white/5 bg-white/5 hover:bg-white/10 hover:border-[#80E0BE]/30 transition-all group">
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span className="text-sm">Google</span>
          </Button>

          <Button onClick={handleMicrosoftLogin} disabled={loading} variant="outline" className="w-full h-12 gap-3 border-white/5 bg-white/5 hover:bg-white/10 hover:border-[#80E0BE]/30 transition-all group">
            <svg className="w-5 h-5 group-hover:scale-110 transition-transform" viewBox="0 0 23 23">
              <rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="12" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="12" width="10" height="10" fill="#00A4EF"/><rect x="12" y="12" width="10" height="10" fill="#FFB900"/>
            </svg>
            <span className="text-sm">Outlook / Microsoft</span>
          </Button>
        </div>

        <div className="flex items-center gap-4 mb-8 opacity-20">
          <div className="h-px flex-1 bg-white" />
          <span className="text-[9px] font-mono uppercase tracking-[0.2em]">O Correo</span>
          <div className="h-px flex-1 bg-white" />
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          <Input type="email" placeholder="Correo electrónico" value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 bg-white/5 border-white/5 focus:border-[#80E0BE]/50" />
          <div className="relative">
            <Input type={showPassword ? "text" : "password"} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 bg-white/5 border-white/5 focus:border-[#80E0BE]/50" />
            <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors">
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <Button type="submit" disabled={loading} className="w-full h-12 bg-[#80E0BE] text-black hover:bg-[#60c09e] font-bold text-sm uppercase tracking-wider transition-all transform active:scale-95">
            {loading ? "Procesando..." : isLogin ? "Iniciar Sesión" : "Crear mi cuenta"}
          </Button>
        </form>

        <button onClick={() => setIsLogin(!isLogin)} className="w-full mt-10 text-[11px] text-white/40 hover:text-[#80E0BE] transition-colors uppercase tracking-[0.2em] font-mono">
          {isLogin ? "— ¿No tienes cuenta? Regístrate —" : "— ¿Ya tienes cuenta? Entra —"}
        </button>
      </div>
    </div>
  );
};

export default Index;
