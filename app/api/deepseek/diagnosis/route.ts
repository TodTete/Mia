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
    const { profile, medicines, moodHistory, sleepHistory } = body;

    const prompt = [
      "Eres Mia, una asistente médica inteligente y experta. Basándote en el perfil del paciente, sus medicamentos actuales, su historial emocional reciente, y su registro de horas y calidad de sueño, genera un resumen de su diagnóstico médico actual y su estado de salud general.",
      "Debes devolver SOLO un JSON válido con la siguiente estructura exacta:",
      `
      {
        "diagnostico": "Un resumen médico profesional, empático y claro (1-2 párrafos) sobre el estado de salud actual del paciente, considerando sus condiciones, peso, edad, la medicación que toma, su estado emocional y MUY IMPORTANTE: un análisis sobre cómo está cuidando su cuerpo al dormir (basado en sus horas y calidad de sueño)."
      }
      `,
      "Genera un análisis que resalte los puntos más importantes de forma profesional y al mismo tiempo cercana.",
      `Perfil del paciente: ${JSON.stringify(profile || {})}`,
      `Medicamentos recetados: ${JSON.stringify(medicines || [])}`,
      `Historial emocional: ${JSON.stringify(moodHistory || [])}`,
      `Historial de sueño: ${JSON.stringify(sleepHistory || [])}`
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
    const result = JSON.parse(jsonText);

    return NextResponse.json({ diagnostico: result.diagnostico });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudo generar el diagnóstico.", detail: message },
      { status: 500 },
    );
  }
}
