# Estructura del proyecto

La idea es separar el trabajo por vistas y, dentro de cada vista, por áreas pequeñas y predecibles. Así cada integrante puede avanzar sin pisar el trabajo del resto.

```text
app/
  layout.tsx
  page.tsx
  vistas/
    usuario-1/
      page.tsx
      components/
      hooks/
      services/
      data/
    usuario-2/
      page.tsx
      components/
      hooks/
      services/
      data/
    usuario-3/
      page.tsx
      components/
      hooks/
      services/
      data/
    usuario-4/
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

- `app/vistas/usuario-1`: primera vista y navegación base.
- `app/vistas/usuario-2`: formularios, validaciones y captura.
- `app/vistas/usuario-3`: listados, tablas, consultas y reportes.
- `app/vistas/usuario-4`: configuración, utilidades y soporte compartido.

## Convención

- Lo que sea reutilizable va en `components/`, `lib/` o `types/`.
- Lo que sea exclusivo de una vista se queda dentro de su carpeta.
- Si una pieza empieza a crecer, se extrae a `components/` o `lib/`.