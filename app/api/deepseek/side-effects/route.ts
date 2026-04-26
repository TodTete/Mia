import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Falta DEEPSEEK_API_KEY en variables de entorno.",
      },
      { status: 500 },
    );
  }

  try {
    const { medicineName } = (await req.json()) as { medicineName: string };

    if (!medicineName) {
      return NextResponse.json(
        { error: "Debes proporcionar el nombre del medicamento." },
        { status: 400 },
      );
    }

    const prompt = `Proporciona una lista concisa y clara de los efectos secundarios más comunes del medicamento "${medicineName}" en español. Únicamente devuelve los puntos clave, sin introducciones largas.`;

    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content: "Eres un asistente médico experto. Proporcionas información precisa sobre medicamentos de forma concisa.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.5,
      }),
    });

    if (!deepseekResponse.ok) {
      return NextResponse.json(
        { error: "Error al consultar DeepSeek." },
        { status: 502 },
      );
    }

    const data = await deepseekResponse.json();
    const sideEffects = data.choices?.[0]?.message?.content ?? "No se encontró información.";

    return NextResponse.json({ sideEffects });
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor." },
      { status: 500 },
    );
  }
}
