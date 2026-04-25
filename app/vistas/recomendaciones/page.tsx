export default function RecomendacionesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-lime-300">Recomendaciones</p>
          <h1 className="mt-4 text-3xl font-semibold">Ejercicios, comida y hábitos</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Las sugerencias se adaptan a síntomas o padecimientos. La prioridad no es
            solo el medicamento, sino el bienestar general y la prevención.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-lg font-semibold">Ejercicios</h2>
            <p className="mt-3 text-sm text-slate-600">Orientación ligera y segura.</p>
          </article>
          <article className="rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-lg font-semibold">Comida</h2>
            <p className="mt-3 text-sm text-slate-600">Sugerencias de alimentación.</p>
          </article>
          <article className="rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-lg font-semibold">Buenos hábitos</h2>
            <p className="mt-3 text-sm text-slate-600">Rutinas para mejorar el día a día.</p>
          </article>
        </section>
      </div>
    </main>
  );
}