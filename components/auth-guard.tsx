"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase/firebase";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);

  // Define public routes that don't require authentication
  const publicRoutes = ["/vistas/login"];

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      const isPublicRoute = publicRoutes.includes(pathname);

      if (!user && !isPublicRoute) {
        // Redirect to login if not authenticated and trying to access a private route
        router.replace("/vistas/login");
      } else if (user && isPublicRoute) {
        // Redirect to home if authenticated and trying to access a public route (like login)
        router.replace("/");
      } else {
        // Allow access
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  if (loading && !publicRoutes.includes(pathname)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#3649cc] border-t-transparent"></div>
          <p className="text-slate-500 font-medium animate-pulse">Verificando acceso...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
