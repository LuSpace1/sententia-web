# Sententia MVP ⚖️

**Democratizando el acceso al conocimiento legal en Chile.**

Sententia es un asistente legal impulsado por Inteligencia Artificial (IA), diseñado como un MVP (Producto Mínimo Viable) para estudiantes, personas naturales, emprendedores y microempresarios (PYMES) que necesitan resolver dudas legales pero no pueden acceder a costosas asesorías o suscripciones premium de IA.

## Propósito del Proyecto

El objetivo principal de este proyecto es demostrar la viabilidad y el poder de combinar **Generación Aumentada por Recuperación (RAG)** utilizando **LangChain** con **Modelos de Lenguaje Open Source (LLMs)**, ejecutándose de manera **100% local**.

### Aspectos Técnicos Destacados
*   **Total Privacidad**: Al utilizar modelos locales (vía Ollama), las consultas de los usuarios -que a menudo contienen información sensible o confidencial- nunca salen de su dispositivo ni se envían a servidores de terceros.
*   **Cero Costo Operativo de Suscripción**: Ideal para personas y organizaciones con bajo presupuesto, sin la necesidad de pagar costos por token o cuotas mensuales.
*   **Ampliación de Conocimiento**: Para maximizar la utilidad del RAG, se pueden indexar documentos legales adicionales según el área de interés del usuario, tanto desde la interfaz web como mediante la shell de Django.
*   **Consideraciones**: Una de las principales limitaciones del sistema es el uso de IA local, que está directamente ligada a la capacidad de cómputo del equipo personal. Los modelos sugeridos para instalar desde Ollama son compatibles con la arquitectura del proyecto, pero se recomienda verificar los requisitos de cada modelo antes de instalarlos.

## Stack Tecnológico

### Backend (Python)
| Componente | Tecnología |
|---|---|
| Framework Web | Django 5.2 + Django REST Framework 3.16 |
| Base de datos vectorial | ChromaDB |
| Framework RAG | LangChain (langchain-ollama, langchain-chroma, langchain-community) |
| LLM local | Ollama (deepseek-r1:8b recomendado) |
| Embeddings | Ollama (mxbai-embed-large recomendado) |
| Autenticación | DRF TokenAuthentication |

### Frontend (TypeScript + React)
| Componente | Tecnología |
|---|---|
| Framework UI | React 19 + Vite 7 |
| Lenguaje | TypeScript 6 |
| Estilos | Tailwind CSS v4 con tema Gold Glassmorphism |
| Enrutamiento | react-router-dom 7 |
| Estado de autenticación | React Context API |
| Cliente HTTP | axios |
| Markdown | react-markdown + remark-gfm |
| Iconos | lucide-react |

## Por qué estos modelos

Elegí estos dos modelos porque:
1. **DeepSeek-R1 (8b)**: Es un modelo altamente optimizado que puede correr localmente en hardware de consumo con excelente capacidad de razonamiento. Su lógica avanzada es ideal para interpretar y explicar textos legales complejos sin requerir grandes servidores.
2. **mxbai-embed-large**: Es un modelo especializado en crear *embeddings* (vectores) de alta calidad para búsqueda semántica. Supera a muchos modelos comerciales, permitiendo que ChromaDB encuentre con gran precisión el artículo exacto de la ley que aplica a la consulta.

> También puedes usar otros modelos compatibles con Ollama. Solo cambia las variables `OLLAMA_LLM_MODEL` y `OLLAMA_EMBED_MODEL` en `backend/.env`.

## Cómo funciona el proyecto (Arquitectura RAG)

Este asistente utiliza el paradigma RAG (**R**etrieval-**A**ugmented **G**eneration), lo que evita que la IA invente respuestas (alucinaciones) obligándola a leer la ley real. Funciona en 3 pasos:

1. **Indexación (Base de Conocimiento):** Los archivos de la carpeta `data/` son leídos, divididos en trozos y convertidos a vectores matemáticos usando *mxbai-embed-large*, para luego guardarse en la base de datos vectorial ChromaDB.
2. **Recuperación (Búsqueda):** Cuando el usuario hace una pregunta en el chat, el sistema cruza la pregunta con ChromaDB usando MMR (Maximum Marginal Relevance) para extraer los fragmentos de la ley más relevantes.
3. **Generación (Respuesta):** Se envía la pregunta del usuario junto con los párrafos de la ley encontrados a *DeepSeek-R1*. La IA redacta su respuesta basándose estricta y únicamente en ese contexto legal recuperado.

### Manejo de saludos y small talk

El sistema detecta automáticamente saludos ("hola", "buenos días"), agradecimientos, despedidas y preguntas sobre el asistente, respondiendo de forma cordial sin invocar al LLM ni a la base vectorial. Esto reduce la latencia y el uso innecesario de recursos.

## Requisitos previos

- Python 3.12+ gestionado con `uv`
- Node.js 20+
- [Ollama](https://ollama.com/) instalado y corriendo localmente

```bash
ollama pull deepseek-r1:8b     # Para generar respuestas
ollama pull mxbai-embed-large  # Para indexado de documentos en ChromaDB
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd sententia-web
```

### 2. Backend (Django)

```bash
# Instalar dependencias del workspace (desde la raíz del proyecto)
uv sync

# Copiar y configurar variables de entorno
cp backend/.env.example backend/.env
# Editar backend/.env y asignar un SECRET_KEY seguro
# Opcional: cambiar OLLAMA_LLM_MODEL y OLLAMA_EMBED_MODEL

# Ejecutar migraciones y servidor
uv run python manage.py migrate
uv run python manage.py runserver
```

> `uv sync` desde la raíz del proyecto utiliza `.python-version` para crear el entorno virtual `.venv` e instala las dependencias de todos los miembros del workspace.

### 3. Frontend (React + Vite + TypeScript)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Variables de Entorno

### Backend (`backend/.env`)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `SECRET_KEY` | Clave secreta de Django | *(obligatorio)* |
| `DEBUG` | Modo depuración | `True` |
| `ALLOWED_HOSTS` | Hosts permitidos | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | Origen del frontend | `http://localhost:5173` |
| `OLLAMA_BASE_URL` | URL del servidor Ollama | `http://localhost:11434` |
| `OLLAMA_LLM_MODEL` | Modelo para generar respuestas | `deepseek-r1:8b` |
| `OLLAMA_EMBED_MODEL` | Modelo para embeddings | `mxbai-embed-large` |
| `RAG_BOOTSTRAP_DEFAULT_DATA` | Indexar PDFs automáticamente al iniciar | `True` |

### Frontend (`frontend/.env`)

| Variable | Descripción | Valor por defecto |
|---|---|---|
| `VITE_API_BASE_URL` | URL del backend Django | `http://localhost:8000` |

## Uso

1. Abre `http://localhost:5173` en tu navegador.
2. Regístrate o inicia sesión (también disponible acceso como invitado).
3. Escribe tu consulta legal en el chat. El sistema buscará en los documentos indexados en `data/` y generará una respuesta con citas a los artículos correspondientes.
4. Usa la función **Entrenar** (icono de ajustes > pestaña "Entrenar") para subir documentos PDF, TXT o MD adicionales y ampliar la base de conocimiento.
5. Desde la shell de Django también puedes indexar documentos:
   ```bash
   uv run python manage.py shell
   ```
   ```python
   from core.rag_logic import LegalRAG
   rag = LegalRAG()
   rag.ingest_file("ruta/al/documento.pdf")
   ```

## Documentos Legales Incluidos

La carpeta `data/` contiene 11 documentos de legislación chilena que se indexan automáticamente al iniciar el sistema:
- Constitución de Chile
- Código Civil, Penal, Procesal Penal, del Trabajo, de Comercio, Tributario, Sanitario, de Minería, de Procedimiento Civil y Orgánico de Tribunales

## Arquitectura del Frontend

```
src/
├── main.tsx                    # Punto de entrada
├── App.tsx                     # Router y layout principal
├── types/index.ts              # Interfaces TypeScript
├── context/
│   ├── AuthContext.tsx          # Proveedor de autenticación
│   ├── AuthContextData.ts      # Definición del contexto
│   └── useAuth.ts              # Hook de autenticación
├── services/api.ts             # Cliente HTTP con tipado genérico
├── pages/
│   ├── Chat.tsx                # Página principal del chat
│   ├── LandingPage.tsx         # Página de aterrizaje
│   ├── Login.tsx               # Inicio de sesión
│   └── Register.tsx            # Registro de usuario
├── components/
│   ├── ChatSidebar.tsx         # Barra lateral con historial
│   ├── ChatMessages.tsx        # Renderizado de mensajes Markdown
│   ├── ChatInput.tsx           # Entrada de texto
│   ├── SettingsModal.tsx       # Configuración y entrenamiento
│   ├── CustomAlert.tsx         # Diálogo de confirmación
│   └── ModelDownloadBanner.tsx # Progreso de descarga de modelos
└── index.css                   # Estilos Tailwind v4 + tema Gold Glassmorphism
```

## Estética

Sententia Web utiliza una estética **Gold Glassmorphism** con los siguientes elementos:
- **Paleta de colores**: Fondos oscuros (#0a0a0f) con acentos dorados (#c3a564) y tonos cobrizos.
- **Efectos glass**: Paneles con backdrop-filter blur y bordes semitransparentes.
- **Tipografía**: Outfit para títulos (display) e Inter para texto (sans-serif), cargadas desde Google Fonts.
- **Animaciones**: Transiciones suaves en mensajes, modales y desplegables, con scrollbar personalizado.
- **Diseño responsive**: Sidebar colapsable en dispositivos móviles.
