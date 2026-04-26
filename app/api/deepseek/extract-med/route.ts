import { NextResponse } from "next/server";

type MedicineInfo = {
  name: string;
  dosage: string;
  route: string;
  frequencyHours: string;
  durationDays: string;
};

const EMPTY_MED: MedicineInfo = {
  name: "",
  dosage: "",
  route: "",
  frequencyHours: "",
  durationDays: "",
};

function extractJsonObject(content: string) {
  const first = content.indexOf("{");
  const last = content.lastIndexOf("}");
  if (first < 0 || last < 0 || last <= first) {
    throw new Error("No se pudo extraer JSON de la respuesta de DeepSeek.");
  }
  return content.slice(first, last + 1);
}

function sanitizeMed(input: unknown): MedicineInfo {
  const source = typeof input === "object" && input ? input : {};
  const result: MedicineInfo = { ...EMPTY_MED };

  for (const key of Object.keys(EMPTY_MED) as Array<keyof MedicineInfo>) {
    const raw = (source as Record<string, unknown>)[key];
    if (raw !== undefined && raw !== null) {
      result[key] = String(raw).trim();
    }
  }

  return result;
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
      {
        error:
          "Falta DEEPSEEK_API_KEY en variables de entorno del servidor.",
      },
      { status: 500 },
    );
  }

  try {
    const body = (await req.json()) as {
      transcript?: string;
      type?: "medicine" | "appointment";
    };

    const transcript = body.transcript?.trim();
    if (!transcript) {
      return NextResponse.json(
        { error: "Debes enviar un transcript con texto." },
        { status: 400 },
      );
    }

    const isAppt = body.type === "appointment";

    const medPrompt = `Extrae los datos de un medicamento desde una conversación en español.
      Devuelve SOLO JSON.
      Campos: name (nombre del medicamento), dosage (cantidad, ej: 500mg, 1 tableta), route (vía de administración, ej: Oral, Intravenosa), frequencyHours (solo el número de horas, ej: 8), durationDays (solo el número de días, ej: 5).
      Si el usuario dice 'cada ocho horas', frequencyHours debe ser '8'.
      Si el usuario dice 'por cinco días', durationDays debe ser '5'.
      Si no hay un dato específico, usa cadena vacía.`;

    const apptPrompt = `Extrae los datos de una cita médica desde una conversación en español.
      Devuelve SOLO JSON.
      Campos: title (motivo o doctor, ej: Dra. Elena Cardiología), date (fecha en formato YYYY-MM-DD), time (hora en formato HH:MM).
      IMPORTANTE: Hoy es ${new Date().toLocaleDateString('es-ES')}. Si el usuario dice 'mañana' o un día de la semana, calcula la fecha correcta.
      Si no hay un dato específico, usa cadena vacía.`;

    const prompt = [
      isAppt ? apptPrompt : medPrompt,
      `Texto: ${transcript}`,
    ].join("\n");

    console.log("Transcript recibido:", transcript);
    console.log("Tipo solicitado:", body.type || "medicine");

    const deepseekResponse = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        stream: false,
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "Eres un extractor de datos médicos preciso. Devuelve solo JSON válido.",
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
      console.error("Error de DeepSeek API:", failedText);
      const deepSeekError = parseDeepSeekError(failedText);
      
      return NextResponse.json(
        {
          error: "DeepSeek devolvió error.",
          code: deepSeekError?.code ?? "deepseek_error",
          detail: deepSeekError?.message ?? failedText,
        },
        { status: 502 },
      );
    }

    const data = (await deepseekResponse.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };

    const content = data.choices?.[0]?.message?.content ?? "";
    console.log("Respuesta raw de DeepSeek:", content);
    
    const jsonText = extractJsonObject(content);
    console.log("JSON extraído:", jsonText);
    
    // Simple validation/sanitization
    let extracted = JSON.parse(jsonText);
    if (isAppt) {
      extracted = {
        title: String(extracted.title || "").trim(),
        date: String(extracted.date || "").trim(),
        time: String(extracted.time || "").trim(),
      };
    } else {
      extracted = sanitizeMed(extracted);
    }

    return NextResponse.json({ extracted });
  } catch (error) {
    console.error("Error en API extract-med:", error);
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudo extraer los datos desde voz.", detail: message },
      { status: 500 },
    );
  }
}
