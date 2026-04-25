export default function RecordatoriosPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[1.15fr_0.85fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Recordatorios</p>
          <h1 className="mt-4 text-3xl font-semibold">Medicinas y consultas</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Mia enviará recordatorios, llevará registro de si la medicina fue tomada y
            mostrará una descripción breve y efectos secundarios posibles.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-8 text-slate-950">
          <h2 className="text-lg font-semibold">También incluye</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>Agenda de futuras consultas.</li>
            <li>Seguimiento de horarios.</li>
            <li>Registro de cumplimiento.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}