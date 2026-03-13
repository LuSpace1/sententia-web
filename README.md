# Sententia ⚖️

Asistente legal chileno con IA, basado en RAG con modelos 100% locales (Ollama + ChromaDB).

## Requisitos previos

- Python 3.12+ gestionado con `uv`
- Node.js 20+
- [Ollama](https://ollama.com/) instalado y corriendo localmente

```bash
ollama pull deepseek-r1:8b
ollama pull mxbai-embed-large
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

> `uv sync` crea automáticamente el entorno virtual `.venv` con Python 3.13 e instala todas las dependencias.

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
