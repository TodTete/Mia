import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { vitals, profile } = await req.json();

    const apiKey = process.env.DEEPSEEK_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DEEPSEEK_API_KEY no está configurada.' },
        { status: 500 }
      );
    }

    const prompt = `
      Actúa como "Mia", una asistente de salud amigable y profesional.
      El usuario acaba de registrar sus signos vitales de hoy y tiene un perfil médico.
      
      Perfil:
      Edad: ${profile.edad || 'Desconocida'}
      Peso: ${profile.peso || 'Desconocido'} kg
      Estatura: ${profile.estatura || 'Desconocida'} cm
      Género: ${profile.genero || 'Desconocido'}
      Padecimientos/Alergias: ${profile.alergias || 'Ninguno'}
      Medicamentos: ${profile.medicacion || 'Ninguno'}

      Signos Vitales actuales:
      Presión Arterial: ${vitals.presion?.val || 'N/A'} mmHg
      Oxigenación: ${vitals.oxigeno?.val || 'N/A'} %
      Temperatura: ${vitals.temperatura?.val || 'N/A'} °C
      Frecuencia Cardíaca: ${vitals.ritmo?.val || 'N/A'} bpm
      Glucosa: ${vitals.glucosa?.val || 'N/A'} mg/dL

      Genera un breve informe de su estado de salud actual (estado de hoy), felicitando o alertando según corresponda. Usa un tono cercano y médico pero fácil de entender. (Máximo 150 palabras).
    `;

    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5,
      }),
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API error: ${response.statusText}`);
    }

    const data = await response.json();
    return NextResponse.json({ report: data.choices[0].message.content });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
