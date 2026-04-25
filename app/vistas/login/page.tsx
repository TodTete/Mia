"use client";

import { useState } from "react";
import Image from "next/image";
import { signInWithEmailAndPassword, signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";
import { auth, googleProvider, db } from "../../../lib/firebase/firebase";
import { ref, get, set } from "firebase/database";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let user;
      try {
        // intentar iniciar sesión
        const result = await signInWithEmailAndPassword(auth, email, password);
        user = result.user;
      } catch (signInErr: any) {
        if (signInErr.code === 'auth/invalid-credential') {
          try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            user = result.user;
          } catch (createErr: any) {
            if (createErr.code === 'auth/email-already-in-use') {
              throw new Error("La contraseña es incorrecta.");
            } else if (createErr.code === 'auth/weak-password') {
              throw new Error("La contraseña debe tener al menos 6 caracteres.");
            } else {
              throw createErr;
            }
          }
        } else {
          throw signInErr;
        }
      }
      
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        await set(userRef, {
          uid: user.uid,
          email: user.email,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          role: 'user'
        });
      } else {
        await set(ref(db, `users/${user.uid}/lastLogin`), new Date().toISOString());
      }

      router.push("/vistas/captura-datos"); 
    } catch (err: any) {
      setError(err.message || "Error al continuar con correo");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userRef = ref(db, `users/${user.uid}`);
      const snapshot = await get(userRef);
      if (!snapshot.exists()) {
        await set(userRef, {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          createdAt: new Date().toISOString(),
          lastLogin: new Date().toISOString(),
          role: 'user'
        });
      } else {
        await set(ref(db, `users/${user.uid}/lastLogin`), new Date().toISOString());
      }

      router.push("/vistas/captura-datos");
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-[100dvh] w-full flex-col items-center justify-center px-4 py-8 font-sans">
      <div className="card-mia w-full max-w-md sm:p-12">
        
        {/* header y logo */}
        <div className="mb-10 flex flex-col items-center text-center">
          <div className="mb-6 flex items-center justify-center">
            {}
            <div className="relative h-20 w-20 overflow-hidden">
              <Image 
                src="/logo.png" 
                alt="Mia Logo" 
                fill 
                sizes="(max-width: 768px) 100vw, 80px"
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">Entrar a MIA</h1>
          <p className="mt-2 text-sm text-black/60 dark:text-white/60">Tu asistente de salud personal</p>
        </div>

        {error && (
          <div className="mb-6 rounded-xl border border-[#d4282f]/20 bg-[#d4282f]/10 p-3 text-sm font-medium text-[#d4282f]">
            {error}
          </div>
        )}

        {/* login con correo y contraseña */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          <div>
            <label className="sr-only" htmlFor="email">Correo electrónico</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Correo electrónico"
              required
              className="input-mia"
            />
          </div>
          <div className="relative">
            <label className="sr-only" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              required
              className="input-mia pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 flex items-center px-4 text-slate-400 hover:text-slate-600 focus:outline-none"
              aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
            >
              {showPassword ? (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              )}
            </button>
          </div>

           <button
            type="submit"
            disabled={loading}
            className="btn-mia-primary mt-2 w-full py-3.5"
          >
            {loading ? "Procesando..." : "Continuar"}
          </button>
        </form>

        <div className="my-8 flex items-center gap-4 before:h-px before:flex-1 before:bg-slate-200 after:h-px after:flex-1 after:bg-slate-200">
          <span className="text-xs font-medium uppercase tracking-wider text-slate-400">O</span>
        </div>

        {/* login con google */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black px-4 py-3.5 text-sm font-medium text-black dark:text-white shadow-sm transition-all hover:bg-slate-50 dark:hover:bg-zinc-900 disabled:opacity-50"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
            <path d="M1 1h22v22H1z" fill="none" />
          </svg>
          Continuar con Google
        </button>
      </div>
    </main>
  );
}