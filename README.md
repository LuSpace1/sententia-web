# Sententia

Un asistente legal que corre completamente local en tu máquina. Habla de leyes chilenas, no alucina (bueno, intenta no hacerlo), y lo mejor de todo: no pides permiso a nadie ni pagas suscripción.

Usa RAG — Retrieval Augmented Generation — para responder preguntas sobre legislación chilena basándose en documentos reales que están indexados en una base de datos vectorial. Todo corre en tu equipo vía Ollama.

## Cómo funciona en tres pasos

1. **Indexación**: Los PDFs de la carpeta `data/` se dividen en fragmentos, se convierten a vectores con un modelo de embeddings, y se guardan en ChromaDB.
2. **Búsqueda**: Cuando preguntas algo, el sistema busca los fragmentos más relevantes dentro de la base vectorial usando MMR (Maximum Marginal Relevance). Si ya has hecho preguntas antes, reformula tu consulta usando el historial para mantener contexto.
3. **Respuesta**: El fragmento de ley encontrado se envía junto con tu pregunta a un modelo LLM local (DeepSeek R1 8b por defecto). La IA genera su respuesta basada estrictamente en ese contexto, con citas a los artículos correspondientes.

> También detecta saludos y los responde sin molestar al LLM. Le dices "hola" y te responde al toque sin gastar recursos en buscar leyes.

## Stack técnico

**Backend**: Django 5.2 + DRF, ChromaDB (base vectorial), LangChain (para el pipeline RAG, específicamente langchain-ollama, langchain-chroma y langchain-community), PyPDF para leer PDFs.

**Frontend**: React 19 con TypeScript 6, Vite 7, Tailwind CSS v4. Los componentes de UI son props-driven, el estado de autenticación vive en un contexto React. Usa axios para las llamadas HTTP y react-markdown para renderizar las respuestas legales.

**Modelos locales**: Todo pasa por Ollama. El proyecto viene configurado con:
- `deepseek-r1:8b` para generar respuestas (puedes cambiarlo)
- `mxbai-embed-large` para los embeddings de búsqueda semántica (puedes cambiarlo)

Ambos modelos son libres y optimizados para correr en hardware de consumo. DeepSeek R1 destaca por su capacidad de razonamiento, ideal para interpretar textos legales complejos. mxbai-embed-large es un modelo de embeddings que sorprende para ser tan liviano.

## Requisitos previos

- Python 3.12+ (gestionado con `uv`)
- Node.js 20+
- [Ollama](https://ollama.com/) instalado y corriendo

```bash
ollama pull deepseek-r1:8b
ollama pull mxbai-embed-large
```

## Instalación

```bash
git clone <url-del-repo>
cd sententia-web

# Backend
uv sync
cp backend/.env.example backend/.env
uv run python manage.py migrate
uv run python manage.py runserver

# Frontend (otra terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

Abre `http://localhost:5173`. Regístrate o entra como invitado.

> `uv sync` usa el archivo `.python-version` en la raíz para crear el entorno virtual con Python 3.12. Instala todo en un solo comando porque el proyecto está configurado como workspace de uv con un solo miembro: `backend/`.

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Por defecto | Para qué sirve |
|---|---|---|
| `SECRET_KEY` | — | Clave de Django. Cámbiala si despliegas. |
| `DEBUG` | `True` | Modo desarrollo. |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Hosts donde servís Django. |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Origen del frontend. |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Dónde corre Ollama. |
| `OLLAMA_LLM_MODEL` | `deepseek-r1:8b` | Modelo que genera las respuestas. |
| `OLLAMA_EMBED_MODEL` | `mxbai-embed-large` | Modelo que genera los vectores. |
| `RAG_BOOTSTRAP_DEFAULT_DATA` | `True` | Indexa los PDFs de `data/` al arrancar si la base está vacía. |

### Frontend (`frontend/.env`)

| Variable | Por defecto | Para qué sirve |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | URL del backend en desarrollo. |

## Endpoints de la API

| Ruta | Método | Autenticación | Qué hace |
|---|---|---|---|
| `/api/chat/` | POST | Token | Envía una consulta legal, recibe respuesta con citas |
| `/api/train/` | POST | Token | Sube un PDF/TXT/MD y lo indexa en ChromaDB |
| `/api/models/pull/` | POST | Token | Descarga un modelo de Ollama (streaming) |
| `/api/register/` | POST | Abierto | Crea un usuario nuevo |
| `/api/login/` | POST | Abierto | Inicia sesión, devuelve token |
| `/api/demo-login/` | POST | Abierto | Acceso rápido como invitado |

## Documentos legales incluidos

Once PDFs con legislación chilena en `data/`:

Constitución de Chile, Código Civil, Código Penal, Código Procesal Penal, Código del Trabajo, Código de Comercio, Código Tributario, Código Sanitario, Código de Minería, Código de Procedimiento Civil, Código Orgánico de Tribunales.

Se indexan solos la primera vez que inicias el backend. Si querés agregar más documentos, podés:

- Desde la UI: botón de ajustes > pestaña "Entrenar" > seleccionar archivo
- Desde la shell: `uv run python manage.py shell` y llamar a `rag.ingest_file("ruta/al/documento.pdf")`

## Cómo está organizado el frontend

```
src/
├── main.tsx                          # Entrada
├── App.tsx                           # Router + AuthProvider
├── types/index.ts                    # Interfaces (Message, Chat, User, etc.)
├── context/
│   ├── AuthContextData.ts            # Definición del contexto
│   ├── AuthContext.tsx               # Provider con localStorage
│   └── useAuth.ts                    # Hook de acceso
├── services/api.ts                   # Cliente HTTP con axios
├── pages/
│   ├── Chat.tsx                      # El chat en sí (567 líneas, la más grande)
│   ├── LandingPage.tsx               # Página principal
│   ├── Login.tsx                     # Inicio de sesión
│   └── Register.tsx                  # Registro
├── components/
│   ├── ChatSidebar.tsx               # Sidebar con historial y búsqueda
│   ├── ChatMessages.tsx              # Renderizado de mensajes con Markdown
│   ├── ChatInput.tsx                 # Input con auto-resize y atajos
│   ├── SettingsModal.tsx             # Subir documentos, configuración
│   ├── CustomAlert.tsx               # Diálogo de confirmación
│   └── ModelDownloadBanner.tsx       # Progreso de descarga de modelos
└── index.css                         # Tailwind v4 con tema Gold Glassmorphism
```

## Para qué (no) sirve

**Sirve para**: estudiantes de derecho que quieren explorar conceptos, emprendedores con dudas legales puntuales, personas que prefieren no subir información sensible a la nube.

**No sirve para**: reemplazar un abogado. Esto es un experimento, un MVP. Puede equivocarse, alucinar o no encontrar la ley exacta. Las respuestas se basan en el contexto que se recuperó, y si el contexto no es preciso, la respuesta va a fallar. Está pensado como herramienta de apoyo, no como dictamen legal.

## Limitaciones conocidas

- Los modelos corren local, así que dependen de tu hardware. DeepSeek R1 8b pide unos 8 GB de RAM como mínimo.
- La base de conocimiento inicial son solo 11 PDFs. Hay áreas enteras del derecho chileno que no están cubiertas.
- El sistema de reformulación de preguntas usa el mismo LLM, lo que suma latencia en consultas con historial.
- La interfaz no está optimizada para móviles más allá de lo básico (el sidebar se oculta).

## Diseño

Tema Gold Glassmorphism: fondos oscuros (#0a0a0f), dorados (#c3a564), paneles con backdrop blur, tipografía Outfit para títulos e Inter para texto. Tailwind v4 con tokens personalizados definidos en `index.css`.

El estilo visual busca parecer más una herramienta profesional que un chatbot genérico. Las animaciones son sutiles (entrada de mensajes, apertura de modales) y la scrollbar está personalizada.
