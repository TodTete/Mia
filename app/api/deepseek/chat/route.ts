import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { message, history, profile } = await req.json();

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY no está configurada.' },
        { status: 500 }
      );
    }

    const systemPrompt = `
      Eres Mia, una asistente de salud virtual amigable, profesional y empática. 
      Estás conversando con el siguiente usuario:
      - Nombre: ${profile?.nombre || 'Usuario'}
      - Edad: ${profile?.edad || 'Desconocida'}
      - Peso: ${profile?.peso || 'Desconocido'} kg
      - Estatura: ${profile?.estatura || 'Desconocida'} cm
      - Género: ${profile?.genero || 'Desconocido'}
      - Tipo de sangre: ${profile?.tipoSangre || 'Desconocido'}
      - Padecimientos/Alergias: ${profile?.alergias || 'Ninguno'}
      - Discapacidades: ${profile?.discapacidad || 'Ninguna'}
      - Medicamentos: ${profile?.medicacion || 'Ninguno'}

      TUS REGLAS ESTRICTAS SON:
      1. SÓLO puedes responder a preguntas sobre salud, bienestar, síntomas médicos, enfermedades, medicamentos, nutrición, hábitos saludables, salud mental o temas relacionados con el bienestar físico o emocional (incluso orientación sexual o reproductiva).
      2. DEBES tomar siempre en cuenta TODOS los datos del usuario (alergias, edad, padecimientos, peso, medicación). Si te hace una pregunta (ej. "¿puedo comer chocolate con maní?") y en sus alergias dice que es alérgico al maní o en sus padecimientos dice que tiene diabetes, DEBES alertarlo de inmediato en base a esos datos. ES OBLIGATORIO usar el perfil del paciente para tus respuestas.
      3. NUNCA diagnostiques formalmente a un paciente. Siempre sugiere consultar a un médico especialista para síntomas graves.
      4. Si el usuario te pregunta sobre programación, códigos, matemáticas, historia mundial, cultura pop, escribir ensayos o cualquier tema que no tenga NADA que ver con la salud o el bienestar, DEBES responder exactamente o algo similar a: "Esa información no la poseo o no sé cómo contestar a esa consulta. Por favor indícame si necesitas orientación en algún padecimiento que tengas, pidiéndome consejos, hábitos, etc."
      5. Responde de forma clara, directa y con un tono cálido y humano. 
      6. MUY IMPORTANTE: NO uses formato Markdown en tu respuesta (NO uses **asteriscos**, ni # numerales, ni listas con guiones). Responde SIEMPRE en texto plano y simple, usando solo párrafos normales. No incluyas caracteres especiales de formato.

      A continuación se incluye el historial de la conversación.
    `;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history.map((msg: any) => ({
        role: msg.role,
        content: msg.content
      })),
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: messages,
        temperature: 0.6,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ reply: data.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
