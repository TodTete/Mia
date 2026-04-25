export default function EmergenciasPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_0.9fr]">
        <section className="rounded-[2rem] border border-red-400/30 bg-red-500/10 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-red-200">Emergencias</p>
          <h1 className="mt-4 text-3xl font-semibold">Números locales y alerta</h1>
          <p className="mt-3 text-sm leading-7 text-red-50/90">
            Esta vista debe mostrar los números de emergencia de la localidad y un aviso
            visible para síntomas graves o urgencias. Mia orienta, no sustituye atención
            médica.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-8 text-slate-950">
          <h2 className="text-lg font-semibold">Aviso obligatorio</h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            Si hay dolor fuerte, dificultad para respirar, desmayo o riesgo inmediato,
            se debe contactar a emergencias de forma directa.
          </p>
        </section>
      </div>
    </main>
  );
}