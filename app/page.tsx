import Link from "next/link";

const teamViews = [
  {
    name: "Usuario 1",
    href: "/vistas/usuario-1",
    focus: "Pantalla principal y navegación base.",
  },
  {
    name: "Usuario 2",
    href: "/vistas/usuario-2",
    focus: "Formularios, validaciones y flujo de captura.",
  },
  {
    name: "Usuario 3",
    href: "/vistas/usuario-3",
    focus: "Listados, consultas y visualización de datos.",
  },
  {
    name: "Usuario 4",
    href: "/vistas/usuario-4",
    focus: "Configuración, soporte y utilidades compartidas.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(56,189,248,0.16),_transparent_40%),linear-gradient(180deg,#0f172a_0%,#111827_45%,#f8fafc_45%,#f8fafc_100%)] px-6 py-8 text-slate-950 sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <section className="rounded-[2rem] border border-white/10 bg-slate-950 px-8 py-10 text-white shadow-2xl shadow-slate-950/30">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300">
            Proyecto en equipo
          </p>
          <div className="mt-4 max-w-3xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
              Estructura limpia para 4 personas y 4 áreas de trabajo.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              Esta portada organiza el proyecto por vistas y separa responsabilidades
              para que cada integrante trabaje en su propia carpeta sin interferir
              con el resto del equipo.
            </p>
          </div>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {teamViews.map((view) => (
            <Link
              key={view.href}
              href={view.href}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                {view.name}
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                {view.href.replace("/vistas/", "")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{view.focus}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-950">
                Entrar a la vista
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">
              Árbol base recomendado
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              La idea es que cada vista tenga su propia carpeta, con sus componentes,
              hooks, servicios y datos locales. Lo compartido queda fuera para evitar
              duplicación y conflictos.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5 text-sm text-slate-200">
            <p className="font-semibold text-white">Carpetas compartidas</p>
            <ul className="mt-3 space-y-2">
              <li>components/ui</li>
              <li>components/common</li>
              <li>lib/firebase</li>
              <li>lib/utils</li>
              <li>types</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
