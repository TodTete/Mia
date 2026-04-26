"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { auth, db } from "../../../lib/firebase/firebase";
import { onAuthStateChanged, signOut, User as FirebaseUser } from "firebase/auth";
import { ref, onValue } from "firebase/database";
import {
  LogOut,
  LogIn,
  ChevronRight,
  User,
  MapPin,
  Droplets,
  Ruler,
  Weight,
  Calendar,
  Phone,
  Pill,
  AlertCircle,
  Accessibility,
  ArrowLeft,
  Trash2,
  X,
  ShieldAlert,
  Download,
  Upload,
} from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { useRouter } from "next/navigation";
import { ViewTutorialModal } from "@/components/ui/view-tutorial-modal";
import { motion, AnimatePresence } from "framer-motion";
import { remove } from "firebase/database";

const STORAGE_KEY = "mia_patient_profile";

type PatientProfile = {
  nombre: string;
  edad: string;
  peso: string;
  estatura: string;
  genero: string;
  localidad: string;
  tipoSangre: string;
  discapacidad: string;
  medicacion: string;
  alergias: string;
  contactoEmergencia: string;
};

export default function PerfilPage() {
  const router = useRouter();
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Load local profile
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setProfile(JSON.parse(stored));
      }
    } catch {}

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        const userRef = ref(db, `users/${currentUser.uid}`);
        onValue(userRef, (snapshot) => {
          const data = snapshot.val();
          if (data) {
          }
        });
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/vistas/login");
  };

  const handleDeleteData = async () => {
    if (user) {
      // Clear Firebase data
      await remove(ref(db, `users/${user.uid}`));
    }
    // Clear localStorage
    localStorage.clear();
    setProfile(null);
    setShowDeleteConfirm(false);
    // Optionally logout too
    await signOut(auth);
    router.push("/vistas/login");
  };

  const handleExportData = () => {
    const data: Record<string, string> = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        data[key] = localStorage.getItem(key) || "";
      }
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mia_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (typeof data === "object") {
          for (const key in data) {
            localStorage.setItem(key, data[key]);
          }
          alert("Datos importados con éxito. La aplicación se recargará.");
          window.location.reload();
        }
      } catch (err) {
        alert("El archivo no es válido o está dañado.");
      }
    };
    reader.readAsText(file);
    // Reset input
    e.target.value = '';
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-black">
        <p className="text-slate-500 dark:text-slate-400 font-medium">Cargando perfil...</p>
      </div>
    );
  }

  const displayName = profile?.nombre || user?.displayName || "Usuario";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  const infoItems = profile
    ? [
        { icon: Calendar, label: "Edad", value: profile.edad ? `${profile.edad} años` : null },
        { icon: Weight, label: "Peso", value: profile.peso ? `${profile.peso} kg` : null },
        { icon: Ruler, label: "Estatura", value: profile.estatura ? `${profile.estatura} cm` : null },
        { icon: User, label: "Género", value: profile.genero ? profile.genero.charAt(0).toUpperCase() + profile.genero.slice(1) : null },
        { icon: MapPin, label: "Localidad", value: profile.localidad || null },
        { icon: Droplets, label: "Tipo de sangre", value: profile.tipoSangre || null },
        { icon: Accessibility, label: "Discapacidad", value: profile.discapacidad || null },
        { icon: Pill, label: "Medicación", value: profile.medicacion || null },
        { icon: AlertCircle, label: "Alergias", value: profile.alergias || null },
        { icon: Phone, label: "Contacto emergencia", value: profile.contactoEmergencia || null },
      ].filter((item) => item.value && item.value !== "N/A")
    : [];

  return (
    <main className="min-h-screen bg-slate-50 dark:bg-black text-slate-900 dark:text-white pt-24 pb-20 transition-colors duration-500">
      <ViewTutorialModal 
        viewId="perfil"
        title="Tu Perfil Médico"
        description="Aquí puedes ver un resumen de tu información de salud, gestionar tu sesión y acceder rápidamente a la edición de tus datos."
      />
      <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-6 h-16 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 shadow-sm transition-colors duration-300">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-[#3345CC] transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Volver al Inicio
          </Link>
        </div>
        <ThemeToggle />
      </header>

      <div className="mx-auto max-w-lg px-6">

        {/* Avatar & Name Card */}
        <div className="mb-6 flex flex-col items-center rounded-3xl border border-slate-100 dark:border-white/5 bg-white dark:bg-zinc-900 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* Avatar */}
          {user?.photoURL ? (
            <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-slate-100 dark:border-white/10 shadow-md">
              <Image
                src={user.photoURL}
                alt="Foto de perfil"
                fill
                sizes="96px"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-[#3649cc] text-3xl font-bold text-white shadow-md shadow-[#3649cc]/20">
              {initials || "U"}
            </div>
          )}

          <h1 className="text-2xl font-bold tracking-tight">{displayName}</h1>
          <p className="mt-1 text-sm text-slate-500">
            {user?.email || "Sin cuenta vinculada"}
          </p>


        </div>

        {/* Profile Data */}
        {infoItems.length > 0 ? (
          <div className="mb-6 rounded-3xl border border-slate-100 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#3649cc]">
                Datos de salud
              </h2>
            </div>
            <div className="divide-y divide-slate-100 dark:divide-white/5">
              {infoItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 dark:bg-black text-slate-500 dark:text-slate-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-3xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-zinc-900/50 p-8 text-center">
            <p className="text-sm text-slate-500">
              Aún no has capturado tus datos de salud.
            </p>
            <Link
              href="/vistas/captura-datos"
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#3649cc] hover:underline"
            >
              Capturar datos <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-6 rounded-3xl border border-slate-100 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <Link
            href="/vistas/captura-datos"
            className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3649cc]/10 text-[#3649cc]">
                <User className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Ver mis datos</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 dark:text-white/20" />
          </Link>

          {!user ? (
            <Link
              href="/vistas/login"
              className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  <LogIn className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold">Iniciar sesión</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 dark:text-white/20" />
            </Link>
          ) : (
            <button
              onClick={() => setShowLogoutConfirm(true)}
              className="flex w-full items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/5 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-red-600 dark:text-red-400">Cerrar sesión</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 dark:text-white/20" />
            </button>
          )}

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex w-full items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/5 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 dark:bg-red-500/20 text-red-500 dark:text-red-400">
                <Trash2 className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-red-600 dark:text-red-400">Borrar mis datos</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 dark:text-white/20" />
          </button>

          <button
            onClick={handleExportData}
            className="flex w-full items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                <Download className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">Exportar datos locales</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300 dark:text-white/20" />
          </button>

          <div className="relative">
            <input 
              type="file" 
              accept=".json" 
              onChange={handleImportData} 
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
              title="Importar datos locales"
            />
            <div className="flex w-full items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-white/5 transition-colors hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400">
                  <Upload className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">Importar datos locales</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 dark:text-white/20" />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 pt-4 pb-12">
          <div className="relative h-4 w-4 overflow-hidden opacity-50">
            <Image src="/logo.png" alt="" fill sizes="16px" className="object-contain" />
          </div>
          <span>MIA v0.1.0</span>
        </div>
      </div>

      {/* Confirmation Modals */}
      <AnimatePresence>
        {/* Logout Confirmation */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
            >
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6">
                  <LogOut className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">¿Cerrar sesión?</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-8">
                  Tendrás que volver a ingresar tus credenciales para acceder a tu historial de salud.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleLogout}
                    className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all"
                  >
                    Confirmar Salida
                  </button>
                  <button
                    onClick={() => setShowLogoutConfirm(false)}
                    className="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Delete Data Confirmation */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-sm bg-white dark:bg-zinc-900 rounded-[2rem] shadow-2xl overflow-hidden border border-slate-200 dark:border-white/10"
            >
              <div className="p-8 text-center">
                <div className="mx-auto w-16 h-16 bg-red-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-red-500/40">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">¿Borrar todos tus datos?</h3>
                <p className="text-sm text-on-surface-variant mb-8">
                  Esta acción es <span className="font-bold text-red-600">irreversible</span>. Se eliminará tu historial, padecimientos y configuración local y en la nube.
                </p>
                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleDeleteData}
                    className="w-full py-4 bg-red-600 text-white font-bold rounded-2xl shadow-lg shadow-red-500/20 hover:bg-red-700 transition-all"
                  >
                    Borrar Permanentemente
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(false)}
                    className="w-full py-4 bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-300 font-bold rounded-2xl hover:bg-slate-200 dark:hover:bg-white/10 transition-all"
                  >
                    Mantener mis datos
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </main>
  );
}
