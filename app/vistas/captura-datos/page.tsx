const patientFields = [
  "Nombre",
  "Edad",
  "Peso",
  "Estatura",
  "Género",
  "Localidad opcional",
  "Tipo de sangre",
  "Discapacidad",
  "Medicación",
  "Alergias",
  "Contacto de emergencia",
];

export default function CapturaDatosPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-cyan-300">Captura</p>
          <h1 className="mt-4 text-3xl font-semibold">Datos manuales o por voz</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">
            La IA solo escucha. Si falta información, la persona la completa manualmente.
            Aquí se recopilan únicamente los datos necesarios para orientar mejor.
          </p>
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {patientFields.map((field) => (
            <article key={field} className="rounded-3xl bg-white p-6 text-slate-950">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-700">
                Campo
              </p>
              <h2 className="mt-3 text-lg font-semibold">{field}</h2>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}