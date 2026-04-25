export default function RegistroEmocionalPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-pink-300">Salud emocional</p>
          <h1 className="mt-4 text-3xl font-semibold">Estado de ánimo y estrés</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            Mia debe priorizar salud mental y señales de alerta emocional para orientar
            mejor y detectar cuándo hace falta apoyo adicional.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-3">
          <article className="rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-lg font-semibold">Estado de ánimo</h2>
          </article>
          <article className="rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-lg font-semibold">Estrés</h2>
          </article>
          <article className="rounded-3xl bg-white p-6 text-slate-950">
            <h2 className="text-lg font-semibold">Alertas</h2>
          </article>
        </section>
      </div>
    </main>
  );
}