# Sententia

**Democratizando el acceso al conocimiento legal en Chile.**

Sententia es un asistente legal basado en inteligencia artificial, diseñado como MVP (Producto Mínimo Viable) para demostrar la integración de **Generación Aumentada por Recuperación (RAG)** utilizando modelos de lenguaje open source ejecutados localmente vía Ollama, sin depender de servicios externos ni suscripciones.

Está orientado a estudiantes, personas naturales, emprendedores y PYMES que necesitan resolver dudas legales pero no pueden acceder a asesorías jurídicas costosas o suscripciones premium de IA.

## Stack tecnológico

**Backend**: Django 5.2 + Django REST Framework 3.16, ChromaDB (base de datos vectorial), LangChain (langchain-ollama, langchain-chroma, langchain-community), PyPDF para carga de documentos.

**Frontend**: React 19 con TypeScript 6, Vite 7, Tailwind CSS v4. Autenticación mediante React Context API. Comunicación HTTP con axios. Renderizado Markdown con react-markdown y remark-gfm.

**Modelos locales**: Todo el procesamiento se ejecuta a través de Ollama. Los modelos configurados por defecto son:
- `deepseek-r1:8b` — modelo de lenguaje para generar respuestas basadas en contexto legal
- `mxbai-embed-large` — modelo de embeddings para búsqueda semántica en la base vectorial

Ambos modelos pueden reemplazarse modificando las variables de entorno correspondientes.

## Arquitectura RAG

El sistema sigue el paradigma RAG en tres etapas:

1. **Indexación**: Los documentos PDF de la carpeta `data/` se dividen en fragmentos (chunks) utilizando `RecursiveCharacterTextSplitter` con separadores adaptados a documentos legales (ARTÍCULO, TÍTULO, LIBRO). Cada fragmento se convierte en un vector mediante el modelo de embeddings y se almacena en ChromaDB.

2. **Recuperación**: Al recibir una consulta, el sistema busca los fragmentos más relevantes usando MMR (Maximum Marginal Relevance) con k=8 documentos y fetch_k=20. Si existe historial de conversación, la pregunta se reformula primero para mantener contexto sin depender de mensajes anteriores.

3. **Generación**: El contexto recuperado se envía junto con la pregunta del usuario al modelo LLM local. La respuesta se redacta estrictamente basada en ese contexto, con citas a los artículos correspondientes cuando están disponibles en los fragmentos recuperados.

El sistema incluye además un clasificador de consultas que detecta saludos, agradecimientos y despedidas mediante expresiones regulares, respondiendo de forma adecuada sin invocar al LLM ni a la base vectorial, reduciendo latencia y uso innecesario de recursos.

## Requisitos previos

- Python 3.12+ gestionado con `uv`
- Node.js 20+
- [Ollama](https://ollama.com/) instalado y en ejecución

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
# Editar backend/.env con SECRET_KEY propio (opcional)
uv run python manage.py migrate
uv run python manage.py runserver

# Frontend (nueva terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

> `uv sync` se ejecuta desde la raíz del proyecto, donde el archivo `.python-version` define la versión de Python y `pyproject.toml` configura el workspace con el miembro `backend/`.

Abrir `http://localhost:5173` en el navegador. Registrarse o acceder como invitado.

## Variables de entorno

### Backend (`backend/.env`)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `SECRET_KEY` | — | Clave secreta de Django |
| `DEBUG` | `True` | Modo depuración |
| `ALLOWED_HOSTS` | `localhost,127.0.0.1` | Hosts permitidos |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:5173` | Origen del frontend |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Dirección del servidor Ollama |
| `OLLAMA_LLM_MODEL` | `deepseek-r1:8b` | Modelo para generar respuestas |
| `OLLAMA_EMBED_MODEL` | `mxbai-embed-large` | Modelo para embeddings |
| `RAG_BOOTSTRAP_DEFAULT_DATA` | `True` | Indexar PDFs automáticamente al iniciar |

### Frontend (`frontend/.env`)

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000` | URL del backend en desarrollo |

## API REST

| Ruta | Método | Autenticación | Descripción |
|---|---|---|---|
| `/api/chat/` | POST | Token requerido | Envía consulta legal, recibe respuesta con citas |
| `/api/train/` | POST | Token requerido | Sube e indexa documento PDF/TXT/MD |
| `/api/models/pull/` | POST | Token requerido | Descarga modelo de Ollama (streaming NDJSON) |
| `/api/register/` | POST | Sin autenticación | Crea usuario nuevo |
| `/api/login/` | POST | Sin autenticación | Inicia sesión, devuelve token |
| `/api/demo-login/` | POST | Sin autenticación | Acceso como invitado |

## Documentos legales incluidos

La carpeta `data/` contiene once PDFs con legislación chilena:

- Constitución de Chile
- Código Civil
- Código Penal
- Código Procesal Penal
- Código del Trabajo
- Código de Comercio
- Código Tributario
- Código Sanitario
- Código de Minería
- Código de Procedimiento Civil
- Código Orgánico de Tribunales

Se indexan automáticamente la primera vez que se inicia el backend. Para agregar documentos adicionales existen dos formas:

1. Desde la interfaz web: menú de ajustes > pestaña "Entrenar" > seleccionar archivo.
2. Desde la shell de Django:
   ```bash
   uv run python manage.py shell
   >>> from core.rag_logic import LegalRAG
   >>> rag = LegalRAG()
   >>> rag.ingest_file("ruta/al/documento.pdf")
   ```

## Estructura del frontend

```
src/
├── main.tsx                            # Punto de entrada
├── App.tsx                             # Router y AuthProvider
├── utils.ts                            # Función generateId()
├── types/index.ts                      # Interfaces compartidas
├── context/
│   ├── AuthContextData.ts              # Definición del contexto
│   ├── AuthContext.tsx                 # Provider con persistencia en localStorage
│   └── useAuth.ts                      # Hook personalizado
├── services/api.ts                     # Cliente HTTP con tipado genérico
├── pages/
│   ├── Chat.tsx                        # Página principal del chat
│   ├── LandingPage.tsx                 # Página de aterrizaje
│   ├── Login.tsx                       # Inicio de sesión
│   └── Register.tsx                    # Registro de usuario
├── components/
│   ├── ChatSidebar.tsx                 # Navegación lateral con historial
│   ├── ChatMessages.tsx                # Renderizado de mensajes en Markdown
│   ├── ChatInput.tsx                   # Entrada de texto con auto-resize
│   ├── SettingsModal.tsx               # Configuración y entrenamiento
│   ├── CustomAlert.tsx                 # Diálogo de confirmación reutilizable
│   └── ModelDownloadBanner.tsx         # Progreso de descarga de modelos
└── index.css                           # Tailwind CSS v4 con tema Gold Glassmorphism
```

## Limitaciones

- El rendimiento depende del hardware local. El modelo deepseek-r1:8b requiere aproximadamente 8 GB de RAM.
- La base de conocimiento inicial abarca once documentos, lo que significa que áreas completas del derecho chileno no están cubiertas.
- El sistema de reformulación de preguntas utiliza el mismo LLM, incrementando la latencia en consultas con historial.
- Este proyecto no reemplaza la asesoría legal profesional. Las respuestas se generan en base al contexto recuperado y pueden contener errores si el contexto es insuficiente o impreciso.

## Diseño visual

El tema Gold Glassmorphism utiliza fondos oscuros (#0a0a0f), acentos dorados (#c3a564) y paneles con efecto blur. La tipografía emplea Outfit para títulos e Inter para texto, cargadas desde Google Fonts. Las animaciones son sutiles y la interfaz es responsiva con sidebar colapsable en dispositivos móviles.
