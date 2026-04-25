export default function InicioPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Inicio</p>
          <h1 className="mt-4 text-3xl font-semibold">Resumen del paciente</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Aquí Mia reúne la información capturada, escucha el padecimiento o
            diagnóstico indicado por la persona y muestra la siguiente acción sugerida.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-8 text-slate-950">
          <h2 className="text-lg font-semibold">Acciones</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>Registrar diagnóstico o padecimiento.</li>
            <li>Agregar medicamentos sugeridos.</li>
            <li>Ir a recomendaciones o recordatorios.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}