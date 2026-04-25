# Estructura del proyecto

La idea es separar el trabajo por funciones reales del asistente Mia. Cada carpeta corresponde a una vista o flujo del producto, no a una persona.

```text
app/
  layout.tsx
  page.tsx
  vistas/
    login/
      page.tsx
      components/
      hooks/
      services/
      data/
    captura-datos/
      page.tsx
      components/
      hooks/
      services/
      data/
    inicio/
      page.tsx
      components/
      hooks/
      services/
      data/
    diagnostico/
      page.tsx
      components/
      hooks/
      services/
      data/
    recomendaciones/
      page.tsx
      components/
      hooks/
      services/
      data/
    recordatorios/
      page.tsx
      components/
      hooks/
      services/
      data/
    avances/
      page.tsx
      components/
      hooks/
      services/
      data/
    emergencias/
      page.tsx
      components/
      hooks/
      services/
      data/
    registro-emocional/
      page.tsx
      components/
      hooks/
      services/
      data/
    registro-salud/
      page.tsx
      components/
      hooks/
      services/
      data/

components/
  ui/
  common/

lib/
  firebase/
  utils/

types/
```

## Reglas de trabajo

- `app/vistas/login`: acceso y consentimiento.
- `app/vistas/captura-datos`: datos manuales o por voz.
- `app/vistas/inicio`: resumen del paciente y punto de entrada.
- `app/vistas/diagnostico`: enfermedad, medicamentos y orientación inicial.
- `app/vistas/recomendaciones`: ejercicios, comida y buenos hábitos.
- `app/vistas/recordatorios`: horarios, control de medicina y futuras consultas.
- `app/vistas/avances`: gráficas y evolución del paciente.
- `app/vistas/emergencias`: números locales y aviso para urgencias.
- `app/vistas/registro-emocional`: ánimo, estrés y alertas emocionales.
- `app/vistas/registro-salud`: sueño, hábitos y feedback general.

## Convención

- Lo reutilizable va en `components/`, `lib/` o `types/`.
- Lo exclusivo de una vista se queda dentro de su carpeta.
- Si una pieza empieza a crecer, se extrae a `components/` o `lib/`.
- La IA debe orientar o sugerir, no diagnosticar.
- Debe existir aviso de emergencia y consentimiento para datos sensibles.
