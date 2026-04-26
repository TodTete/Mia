import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta DEEPSEEK_API_KEY en variables de entorno del servidor (.env.local)." },
      { status: 500 },
    );
  }

  try {
    const { currentProfile } = await req.json();

    // Determine missing fields
    const missingFields = Object.entries(currentProfile || {})
      .filter(([key, val]) => !val)
      .map(([key]) => key);

    const promptText = missingFields.length === 0 
      ? "El perfil está completo. Pregúntale amablemente al paciente si hay algún otro dato médico que le gustaría añadir o actualizar."
      : `El paciente quiere dictar su expediente médico de una sola vez. Genera un saludo corto, amigable y empático presentándote como Mia (su asistente de salud). Pídele de forma natural que te dicte sus datos personales (como nombre, edad, género, localidad), sus datos físicos (peso, estatura, tipo de sangre), su historial médico (alergias, enfermedades, hábitos) y su contacto de emergencia. Evita viñetas o símbolos raros, el texto será leído por un sintetizador de voz. Limítate a 2-3 oraciones fluidas.`;

    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.7,
        messages: [
          {
            role: "system",
            content: "Eres Mia, una asistente médica virtual empática, profesional y concisa. Respondes siempre en español.",
          },
          {
            role: "user",
            content: promptText,
          },
        ],
      }),
    });

    if (!deepseekResponse.ok) {
      return NextResponse.json({ error: "DeepSeek devolvió error al generar voz." }, { status: 502 });
    }

    const data = await deepseekResponse.json();
    const message = data.choices?.[0]?.message?.content ?? "Hola, soy Mia. ¿Podrías indicarme tus datos médicos?";

    return NextResponse.json({ message });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudo generar la respuesta de voz.", detail: message },
      { status: 500 },
    );
  }
}