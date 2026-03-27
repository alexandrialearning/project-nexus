import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KeyRound, Eye, EyeOff } from "lucide-react";

const Index = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
        <div className="mb-12 text-center">
          <h1 className="font-heading text-2xl font-light tracking-[0.2em] text-foreground">
            Alexandr<span className="text-gradient-gold">.ia</span>
          </h1>
          <p className="mt-2 font-mono-code text-[11px] tracking-[0.3em] text-muted-foreground uppercase">
            Scroll_v2
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={(e) => e.preventDefault()}
          className="space-y-5"
        >
          <div className="space-y-3">
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={isLogin ? "current-password" : "new-password"}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <Button variant="gold" size="lg" className="w-full h-12 gap-2.5">
            <KeyRound size={14} />
            {isLogin ? "Iniciar sesión" : "Crear cuenta"}
          </Button>
        </form>

        {/* Toggle */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-secondary-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            {isLogin ? "Sign Up" : "Sign In"}
          </button>
        </p>

        {/* Footer accent */}
        <div className="mt-16 flex items-center justify-center gap-3">
          <div className="h-px w-8 bg-border" />
          <span className="font-mono-code text-[9px] tracking-[0.4em] text-muted-foreground uppercase">
            Secure · Private · Encrypted
          </span>
          <div className="h-px w-8 bg-border" />
        </div>
      </div>
    </div>
  );
};

export default Index;
