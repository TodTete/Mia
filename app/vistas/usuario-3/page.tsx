export default function Usuario3Page() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-emerald-300">Usuario 3</p>
          <h1 className="mt-4 text-3xl font-semibold">Listados y reportes</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">
            Carpeta reservada para vistas de lectura, tablas, filtros, gráficas y
            componentes de análisis.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <div className="rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-lg font-semibold">Subcarpetas</h2>
            <ul className="mt-4 space-y-2 text-sm text-slate-600">
              <li>components</li>
              <li>hooks</li>
              <li>services</li>
              <li>data</li>
            </ul>
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900 p-6">
            <h2 className="text-lg font-semibold">Responsabilidad sugerida</h2>
            <p className="mt-4 text-sm leading-7 text-slate-300">
              Encargado de consultas, visualización de datos y componentes de lectura
              intensiva.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}