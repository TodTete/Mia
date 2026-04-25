export default function RegistroSaludPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-4xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-teal-300">Registro de salud</p>
          <h1 className="mt-4 text-3xl font-semibold">Sueño, hábitos y feedback</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Esta vista recoge horas de dormir, hábitos diarios, comida y actividades para
            ofrecer orientación útil y no centrarse solo en medicamentos.
          </p>
        </section>

        <section className="rounded-4xl bg-white p-8 text-slate-950">
          <h2 className="text-lg font-semibold">Datos principales</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>Horas de dormir.</li>
            <li>Hábitos diarios.</li>
            <li>Recomendaciones y seguimiento.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}