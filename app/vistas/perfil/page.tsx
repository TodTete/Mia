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
} from "lucide-react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "mia-profile-v1";

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

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium">Cargando perfil...</p>
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
    <main className="min-h-screen bg-slate-50 px-6 py-10 font-sans text-slate-900 sm:px-10">
      <div className="mx-auto max-w-lg">
        {/* Back link */}
        <Link
          href="/vistas/inicio"
          className="mb-8 inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-[#3649cc]"
        >
          <ChevronRight className="h-4 w-4 rotate-180" />
          Inicio
        </Link>

        {/* Avatar & Name Card */}
        <div className="mb-6 flex flex-col items-center rounded-3xl border border-slate-100 bg-white p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          {/* Avatar */}
          {user?.photoURL ? (
            <div className="relative mb-4 h-24 w-24 overflow-hidden rounded-full border-4 border-slate-100 shadow-md">
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
          <div className="mb-6 rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
            <div className="px-6 pt-5 pb-3">
              <h2 className="text-sm font-bold uppercase tracking-widest text-[#3649cc]">
                Datos de salud
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {infoItems.map((item) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.label}
                    className="flex items-center gap-4 px-6 py-4"
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-500">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
                        {item.label}
                      </p>
                      <p className="text-sm font-semibold text-slate-900">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center">
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
        <div className="mb-6 rounded-3xl border border-slate-100 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden">
          <Link
            href="/vistas/captura-datos"
            className="flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3649cc]/10 text-[#3649cc]">
                <User className="h-5 w-5" />
              </div>
              <span className="text-sm font-semibold">Ver mis datos</span>
            </div>
            <ChevronRight className="h-5 w-5 text-slate-300" />
          </Link>

          {!user ? (
            <Link
              href="/vistas/login"
              className="flex items-center justify-between px-6 py-4 border-t border-slate-100 transition-colors hover:bg-slate-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-600">
                  <LogIn className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold">Iniciar sesión</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </Link>
          ) : (
            <button
              onClick={handleLogout}
              className="flex w-full items-center justify-between px-6 py-4 border-t border-slate-100 transition-colors hover:bg-red-50"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-red-500">
                  <LogOut className="h-5 w-5" />
                </div>
                <span className="text-sm font-semibold text-red-600">Cerrar sesión</span>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300" />
            </button>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 pt-4">
          <div className="relative h-4 w-4 overflow-hidden opacity-50">
            <Image src="/logo.png" alt="" fill sizes="16px" className="object-contain" />
          </div>
          <span>MIA v0.1.0</span>
        </div>
      </div>
    </main>
  );
}
