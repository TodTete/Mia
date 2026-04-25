import Link from "next/link";

const teamViews = [
  {
    name: "Login y acceso",
    href: "/vistas/login",
    focus: "Entrada, consentimiento y arranque seguro.",
  },
  {
    name: "Captura de datos",
    href: "/vistas/captura-datos",
    focus: "Registro manual o por voz con validación humana.",
  },
  {
    name: "Inicio y diagnóstico",
    href: "/vistas/inicio",
    focus: "Resumen del paciente y orientación inicial.",
  },
  {
    name: "Recomendaciones",
    href: "/vistas/recomendaciones",
    focus: "Ejercicios, comida y buenos hábitos personalizados.",
  },
];

const supportViews = [
  {
    name: "Recordatorios",
    href: "/vistas/recordatorios",
    focus: "Medicamentos, horarios, consulta y seguimiento.",
  },
  {
    name: "Avances",
    href: "/vistas/avances",
    focus: "Evolución de peso, salud y gráfica de progreso.",
  },
  {
    name: "Emergencias",
    href: "/vistas/emergencias",
    focus: "Números locales y aviso visible para síntomas graves.",
  },
  {
    name: "Salud emocional",
    href: "/vistas/registro-emocional",
    focus: "Estado de ánimo, estrés y señales de alerta.",
  },
  {
    name: "Registro de salud",
    href: "/vistas/registro-salud",
    focus: "Sueño, hábitos y retroalimentación general.",
  },
  {
    name: "Función de diagnóstico",
    href: "/vistas/diagnostico",
    focus: "Registro del padecimiento y medicamentos a tomar.",
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
              Mia: asistente de salud orientado a recopilar, acompañar y seguir.
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
              La estructura está pensada por funciones reales del producto: acceso,
              captura manual o por voz, recomendaciones, recordatorios, avances,
              emergencias y registros emocionales y de salud.
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

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {supportViews.map((view) => (
            <Link
              key={view.href}
              href={view.href}
              className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-transform duration-200 hover:-translate-y-1 hover:shadow-xl"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-700">
                {view.name}
              </p>
              <h2 className="mt-4 text-2xl font-semibold text-slate-950">
                {view.href.replace("/vistas/", "")}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{view.focus}</p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-slate-950">
                Abrir vista
                <span className="transition-transform group-hover:translate-x-1">→</span>
              </span>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="text-2xl font-semibold text-slate-950">
              Reglas del proyecto
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
              No se debe prometer precisión médica total ni sustituir al médico. La
              interfaz debe pedir consentimiento claro para datos sensibles, limitarse
              al mínimo necesario y mostrar valor inmediato desde el primer uso.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-950 p-5 text-sm text-slate-200">
            <p className="font-semibold text-white">Avisos clave</p>
            <ul className="mt-3 space-y-2">
              <li>No diagnosticar: orientar o sugerir.</li>
              <li>Agregar aviso de emergencia para síntomas graves.</li>
              <li>Priorizar salud mental y hábitos.</li>
              <li>Permitir carga manual si la voz no completa datos.</li>
            </ul>
          </div>
        </section>
      </div>
    </main>
  );
}
