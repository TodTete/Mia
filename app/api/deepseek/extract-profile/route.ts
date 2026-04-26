import { NextResponse } from "next/server";

type PatientProfile = {
  nombres: string;
  edad: string;
  peso: string;
  estatura: string;
  genero: string;
  curp: string;
  ocupacion: string;
  localidad: string;
  tipoSangre: string;
  discapacidad: string;
  medicacion: string;
  alergias: string;
  antecedentesHeredofamiliares: string;
  antecedentesPatologicos: string;
  habitosVida: string;
  contactoEmergencia: string;
  nombreContactoEmergencia: string;
};

const EMPTY_PROFILE: PatientProfile = {
  nombres: "",
  edad: "",
  peso: "",
  estatura: "",
  genero: "",
  curp: "",
  ocupacion: "",
  localidad: "",
  tipoSangre: "",
  discapacidad: "",
  medicacion: "",
  alergias: "",
  antecedentesHeredofamiliares: "",
  antecedentesPatologicos: "",
  habitosVida: "",
  contactoEmergencia: "",
  nombreContactoEmergencia: "",
};

function extractJsonObject(content: string) {
  const first = content.indexOf("{");
  const last = content.lastIndexOf("}");
  if (first < 0 || last < 0 || last <= first) {
    throw new Error("No se pudo extraer JSON de la respuesta de DeepSeek.");
  }
  return content.slice(first, last + 1);
}

function sanitizeProfile(input: unknown): PatientProfile {
  const source = typeof input === "object" && input ? input : {};
  const result: PatientProfile = { ...EMPTY_PROFILE };

  for (const key of Object.keys(EMPTY_PROFILE) as Array<keyof PatientProfile>) {
    const raw = (source as Record<string, unknown>)[key];
    if (typeof raw === "string") {
      result[key] = raw.trim();
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
          "Falta DEEPSEEK_API_KEY en variables de entorno del servidor (.env.local).",
      },
      { status: 500 },
    );
  }

  try {
    const body = (await req.json()) as {
      transcript?: string;
      currentProfile?: Partial<PatientProfile>;
    };

    const transcript = body.transcript?.trim();
    if (!transcript) {
      return NextResponse.json(
        { error: "Debes enviar un transcript con texto." },
        { status: 400 },
      );
    }

    const currentProfile = sanitizeProfile(body.currentProfile);

    const prompt = [
      "Extrae datos de paciente desde una conversación en español.",
      "Devuelve SOLO JSON.",
      "Campos: nombres, edad, peso, estatura, genero (hombre, mujer, otro), curp, ocupacion, localidad, tipoSangre, discapacidad, medicacion, alergias, antecedentesHeredofamiliares, antecedentesPatologicos, habitosVida, contactoEmergencia, nombreContactoEmergencia.",
      "Importante: 'nombres' debe ser el nombre completo del paciente.",
      "Si no hay dato, usa cadena vacía.",
      `Contexto actual: ${JSON.stringify(currentProfile)}`,
      `Texto: ${transcript}`,
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
        temperature: 0.1,
        messages: [
          {
            role: "system",
            content:
              "Eres un extractor estricto de datos clínicos administrativos. Devuelve solo JSON válido.",
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
          {
            error:
              "Saldo insuficiente en DeepSeek. Recarga creditos o cambia a una API key con saldo.",
            code: "insufficient_balance",
            detail: deepSeekError?.message ?? failedText,
          },
          { status: 402 },
        );
      }

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
    const jsonText = extractJsonObject(content);
    const extracted = sanitizeProfile(JSON.parse(jsonText));

    return NextResponse.json({ extracted });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Error desconocido";
    return NextResponse.json(
      { error: "No se pudo extraer el perfil desde voz.", detail: message },
      { status: 500 },
    );
  }
}