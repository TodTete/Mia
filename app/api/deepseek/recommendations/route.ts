import { NextResponse } from "next/server";

function extractJsonObject(content: string) {
  const first = content.indexOf("{");
  const last = content.lastIndexOf("}");
  if (first < 0 || last < 0 || last <= first) {
    throw new Error("No se pudo extraer JSON de la respuesta de DeepSeek.");
  }
  return content.slice(first, last + 1);
}

function parseDeepSeekError(raw: string) {
  try {
    const parsed = JSON.parse(raw) as {
      error?: { message?: string; code?: string; type?: string };
    };
    return parsed.error;
  } catch {
    return undefined;
  }
}

export async function POST(req: Request) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const model = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

  if (!apiKey) {
    return NextResponse.json(
      { error: "Falta DEEPSEEK_API_KEY en variables de entorno del servidor." },
      { status: 500 },
    );
  }

  try {
    const body = await req.json();
    const { profile, medicines } = body;

    const prompt = [
      "Eres un médico y experto en bienestar. Basándote en el perfil del paciente y sus medicamentos actuales, genera recomendaciones personalizadas de salud, priorizando la prevención y el bienestar general.",
      "Debes devolver SOLO un JSON válido con la siguiente estructura exacta:",
      `
      {
        "context": ["Lista de 2 a 4 áreas de enfoque principal, ej: 'Control de Glucosa', 'Salud Cardiovascular'"],
        "exercises": [
          { "title": "Nombre del ejercicio", "desc": "Descripción detallada y precauciones" }
        ],
        "foods": [
          { "title": "Nombre del alimento/hábito", "desc": "Por qué es bueno y cómo consumirlo" }
        ],
        "habits": [
          { "title": "Hábito saludable", "desc": "Cómo implementarlo en el día a día" }
        ]
      }
      `,
      "Genera al menos 3 items detallados, útiles y seguros para cada categoría (exercises, foods, habits). Adapta estrictamente el contenido a las enfermedades, discapacidades o alergias del paciente.",
      `Perfil del paciente: ${JSON.stringify(profile || {})}`,
      `Medicamentos recetados (de recordatorios): ${JSON.stringify(medicines || [])}`
    ].join("\n");

    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content: "Eres un asistente médico inteligente. Devuelve SOLO JSON estructurado.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!deepseekResponse.ok) {
      const failedText = await deepseekResponse.text();
      const deepSeekError = parseDeepSeekError(failedText);
      const normalizedMessage = (deepSeekError?.message ?? "").toLowerCase();

      if (normalizedMessage.includes("insufficient balance")) {
        return NextResponse.json(
          { error: "Saldo insuficiente en DeepSeek.", code: "insufficient_balance" },
          { status: 402 },
        );
      }

      return NextResponse.json(
        { error: "DeepSeek devolvió error.", detail: deepSeekError?.message ?? failedText },
        { status: 502 },
      );
    }

    const data = await deepseekResponse.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const jsonText = extractJsonObject(content);
    const recommendations = JSON.parse(jsonText);

    return NextResponse.json({ recommendations });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudieron generar las recomendaciones.", detail: message },
      { status: 500 },
    );
  }
}
