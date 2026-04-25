export default function AvancesPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-violet-300">Avances</p>
          <h1 className="mt-4 text-3xl font-semibold">Evolución del paciente</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Conforme haya consultas, se actualizan peso, edad, hábitos y otros avances de
            salud. La vista debe incluir una gráfica con una escala del 1 al 10.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2">
          <article className="rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-lg font-semibold">Datos que se actualizan</h2>
            <p className="mt-3 text-sm text-slate-600">Peso, edad y progreso general.</p>
          </article>
          <article className="rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-lg font-semibold">Gráfica de salud</h2>
            <p className="mt-3 text-sm text-slate-600">Escala visual de avance 1 a 10.</p>
          </article>
        </section>
      </div>
    </main>
  );
}