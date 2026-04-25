export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-white sm:px-10">
      <div className="mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8">
          <p className="text-sm uppercase tracking-[0.35em] text-sky-300">Login</p>
          <h1 className="mt-4 text-3xl font-semibold">Entrada con consentimiento</h1>
          <p className="mt-3 text-sm leading-7 text-slate-300">
            Mia inicia aquí. El usuario debe aceptar el uso responsable de datos
            sensibles y elegir si quiere continuar con captura manual o por voz.
          </p>
        </section>

        <section className="rounded-[2rem] bg-white p-8 text-slate-950">
          <h2 className="text-lg font-semibold">Lo mínimo necesario</h2>
          <ul className="mt-4 space-y-3 text-sm text-slate-600">
            <li>Consentimiento claro.</li>
            <li>Acceso seguro.</li>
            <li>Opción de continuar con voz o manualmente.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}