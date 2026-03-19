# Sententia MVP ⚖️

**Democratizando el acceso al conocimiento legal en Chile.**

Sententia es un asistente legal impulsado por Inteligencia Artificial (IA), diseñado como un MVP (Producto Mínimo Viable) para estudiantes, personas naturales, emprendedores y microempresarios (PYMES) que necesitan resolver dudas legales pero no pueden acceder a costosas asesorías o suscripciones premium de IA.

## Propósito del Proyecto

El objetivo principal de este proyecto es demostrar la viabilidad y el poder de combinar **Generación Aumentada por Recuperación (RAG)** utilizando **Langchain** con **Modelos de Lenguaje Open Source (LLMs)**, ejecutándose de manera **100% local**.

### Aspectos Técnicos Destacados
*   **Total Privacidad**: Al utilizar modelos locales (vía Ollama), las consultas de los usuarios -que a menudo contienen información sensible u confidencial- nunca salen de su dispositivo ni se envían a servidores de terceros.
*   **Cero Costo Operativo de Suscripción**: Ideal para personas y organizaciones con bajo presupuesto, sin la necesidad de pagar altos costos por token o cuotas mensuales habituales.
*   **Archivos Sugeridos (Ampliación de Conocimiento)**: Para maximizar la utilidad del RAG, se recomienda indexar documentos legales dependiendo del área de interés del usuario que el usuario quiera consultar: 
*  **Consideraciones**: Uno de los principales propositos de este proyecto es poder utilizar langchain y sus herramientas para poder crear un sistema de RAG robusto y estable, sin embargo una de las limitaciones que tiene este sistema es el uso de AI local que esta directamente ligada a la capacidad de computo de tu equipo personal. Los modelos que se sugiere instalar desde ollama son por motivos de compatibilidad con la arquitectura del proyecto pero no garantiza que vayan a correr en tu equipo, se recomienda ampliamente verificar los requisitos de cada modelo.

## Por qué estos modelos:

Elegí estos dos modelos porque:
1. **DeepSeek-R1 (8b)**: Es un modelo altamente optimizado que puede correr localmente en hardware de consumo con excelente capacidad de razonamiento. Su lógica avanzada es ideal para interpretar y explicar textos legales complejos sin requerir de grandes servidores.
2. **mxbai-embed-large**: Es un modelo especializado en crear *embeddings* (vectores) de alta calidad para búsqueda semántica. Supera a muchos modelos comerciales, permitiendo que la base de datos (ChromaDB) encuentre con gran precisión el artículo exacto de la ley que aplica a la consulta.

## Cómo funciona el proyecto (Arquitectura RAG)

Este asistente utiliza el paradigma RAG (**R**etrieval-**A**ugmented **G**eneration), lo que evita que la IA invente respuestas (alucinaciones) obligándola a leer la ley real. Funciona en 3 pasos:

1. **Indexación (Base de Conocimiento):** Los archivos de la carpeta `data/` son leídos, divididos en trozos y convertidos a vectores matemáticos usando *mxbai-embed-large*, para luego guardarse en la base de datos vectorial ChromaDB.
2. **Recuperación (Búsqueda):** Cuando el usuario hace una pregunta en el chat, el sistema cruza la pregunta con ChromaDB para extraer los fragmentos de la ley más relevantes.
3. **Generación (Respuesta):** Se envía la pregunta del usuario junto con los párrafos de la ley encontrados a *DeepSeek-R1*. La IA redacta su respuesta basándose estricta y únicamente en ese contexto legal recuperado.

## Requisitos previos

- Python 3.12+ gestionado con `uv`
- Node.js 20+
- [Ollama](https://ollama.com/) instalado y corriendo localmente

```bash
ollama pull deepseek-r1:8b # Para generar respuestas
ollama pull mxbai-embed-large # Para indexado de documentos en ChromaDB
```

## Instalación

### 1. Clonar el repositorio

```bash
git clone <url-del-repo>
cd sententia
```

### 2. Backend (Django)

```bash
cd backend
uv sync
cp .env.example .env
# Editar .env y asignar un SECRET_KEY seguro
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

> `uv sync` utiliza el archivo `.python-version` para crear automáticamente el entorno virtual `.venv` con Python 3.12 e instala todas las dependencias. Si no tienes esa versión instalada, `uv` la descargará automáticamente.

### 3. Frontend (React + Vite)

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## Uso

1. Abre `http://localhost:5173` en tu navegador.
2. Regístrate o inicia sesión.
3. El sistema consulta la base de conocimiento legal (documentos indexados en `data/`).

> Para indexar nuevos documentos (PDF o TXT) usa `LegalRAG.ingest_file()` desde la shell de Django (`python manage.py shell`).

## Estructura del proyecto

```
sententia/
├── backend/          # Django + DRF + LangChain
│   ├── config/       # Settings, URLs, WSGI/ASGI
│   └── core/         # App principal: views, serializers, RAG
├── data/             # Documentos legales y base vectorial (ChromaDB)
└── frontend/         # React + Vite
    └── src/
        ├── components/
        └── services/
```
