# Mia - Medical Intelligent Assistant 🩺✨

**Mia** es una aplicación web progresiva (PWA) de vanguardia diseñada para empoderar a los usuarios en el control, monitoreo y gestión de su salud física y emocional. Utilizando Inteligencia Artificial avanzada (DeepSeek), Mia actúa como una asistente personal y analista clínica que te acompaña en tu día a día de manera empática y segura.

---

## 🚀 Características Principales

### 🤖 Asistente Virtual Inteligente (IA)
- **Chat Flotante Integrado:** Habla con Mia en cualquier momento. La IA tiene contexto total de tus datos físicos, alergias, padecimientos y medicamentos para brindarte respuestas precisas y personalizadas sobre tu bienestar.
- **Análisis Clínico y Diagnósticos:** A través de la pestaña de *Avances*, Mia analiza tu historial de sueño, estado de ánimo y bitácora clínica para generar resúmenes profesionales ("Insights") sobre tu salud general.
- **Captura de Datos por Voz:** No necesitas llenar formularios largos. Simplemente háblale a Mia y ella se encargará de extraer tus datos (peso, edad, alergias, etc.) de manera natural y llenar el perfil por ti.

### 📊 Monitoreo Biométrico y Evolutivo
- **Historia Bio-Digital:** Visualiza gráficas interactivas detalladas de tu progreso.
- **Registro Emocional:** Lleva un trackeo diario de tus estados de ánimo (0-10) con una gráfica visual atractiva en color rojo/coral para detectar patrones.
- **Historial de Sueño:** Monitoriza tus horas de descanso con un gráfico dinámico en color índigo, donde Mia podrá evaluar tu calidad de descanso.

### 💊 Gestión Médica
- **Bitácora Clínica:** Añade tus padecimientos activos.
- **Control de Medicamentos:** Organiza tus medicamentos con dosis y horarios.
- **Contactos de Emergencia:** Mantén accesible a tus seres queridos en caso de crisis.

### 💾 Privacidad y Portabilidad Total
- **Sincronización Inteligente:** Todos tus datos médicos se guardan de forma segura usando **Firebase**.
- **First-Local (Modo Offline-ready):** Los perfiles se sincronizan en el `localStorage` de tu navegador para que los módulos de la IA y gráficas funcionen a la velocidad del rayo, mitigando latencias.
- **Exportación e Importación:** Genera respaldos de tus datos médicos locales para portabilidad entre dispositivos con solo un clic en la vista de Perfil.

### 🎨 Experiencia de Usuario (UI/UX)
- **Glassmorphism y Animaciones:** Diseño hiper-moderno con desenfoque de fondo y animaciones fluidas impulsadas por *Framer Motion*.
- **Modo Oscuro/Claro:** Soporte nativo para `next-themes`.
- **Responsive PWA:** Adaptación perfecta para pantallas de celular. Instalable en el inicio de tu teléfono como una app nativa.

---

## 💻 Stack Tecnológico

- **Framework:** [Next.js 16](https://nextjs.org/) (App Router)
- **Estilos:** [Tailwind CSS](https://tailwindcss.com/)
- **Animaciones e Interacciones:** [Framer Motion](https://www.framer.com/motion/)
- **Iconografía:** [Lucide React](https://lucide.dev/)
- **Base de Datos & Auth:** [Firebase](https://firebase.google.com/) (Realtime Database y Authentication)
- **IA Engine:** [DeepSeek API](https://www.deepseek.com/) (Modelos de lenguaje avanzados y extracción de entidades)
- **Visualización de Datos:** [Recharts](https://recharts.org/)

---

## 🛠️ Instalación y Configuración Local

Sigue estos pasos para correr el entorno de desarrollo en tu computadora.

### 1. Clonar el repositorio
```bash
git clone https://github.com/TodTete/Mia.git
cd mia
```

### 2. Instalar dependencias
```bash
npm install
```

### 3. Configurar Variables de Entorno
Crea un archivo llamado `.env.local` en la raíz del proyecto. Deberás añadir las credenciales de tu proyecto de Firebase y tu clave de DeepSeek:

```env
# Configuración DeepSeek AI
DEEPSEEK_API_KEY="tu_api_key_aqui"
DEEPSEEK_MODEL="deepseek-chat"

# Configuración Firebase
NEXT_PUBLIC_FIREBASE_API_KEY="tu_firebase_api_key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="tu_auth_domain"
NEXT_PUBLIC_FIREBASE_DATABASE_URL="tu_database_url"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="tu_project_id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="tu_storage_bucket"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="tu_sender_id"
NEXT_PUBLIC_FIREBASE_APP_ID="tu_app_id"
```
*(Nota: Sustituye los valores entre comillas por las credenciales correspondientes a tus proyectos).*

### 4. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación funcionando.

---

## 📂 Estructura Principal del Proyecto

- `/app/api`: Rutas de la API Backend, incluye la lógica de DeepSeek para chat, diagnóstico y captura por voz.
- `/app/vistas`: Módulos principales de la aplicación (`avances`, `captura-datos`, `diagnostico`, `horario-sueno`, `perfil`, etc.)
- `/components/ui`: Componentes de interfaz reutilizables (Botones flotantes, Modales, Tarjetas, ChatBot de Mia, etc.)
- `/lib/firebase`: Configuración e inicialización del cliente de Firebase.

---

## ⚠️ Aviso Legal y Descargo de Responsabilidad

**Mia NO es un médico, ni un profesional de la salud certificado.**
Toda la información proporcionada por la IA de Mia, incluyendo el análisis de diagnósticos, recomendaciones de sueño y gestión emocional, es de **carácter estrictamente informativo y de apoyo**. 
- No debes utilizar a Mia como sustituto de un diagnóstico médico, orientación clínica, o tratamiento profesional. 
- En caso de una emergencia médica física o psicológica, ponte en contacto de inmediato con las líneas de emergencia de tu país (ej. 911) o acude a urgencias.

---

*Hecho por Amor a Puebla para revolucionar el bienestar personal impulsado por IA.*
