import os
import json
import urllib.request
import urllib.request
from pathlib import Path

from decouple import config
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter

# Ruta absoluta al directorio de la base de datos vectorial
_CHROMA_DIR = str(Path(__file__).resolve().parent.parent.parent / "data" / "chroma_db")
_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
_SUPPORTED_EXTENSIONS = (".pdf", ".txt", ".md")


class ModelDependencyError(RuntimeError):
    """Se usa cuando falta un modelo requerido en Ollama."""

    def __init__(self, model_name: str, purpose: str):
        super().__init__(f'Falta el modelo de Ollama "{model_name}"')
        self.model_name = model_name
        self.purpose = purpose

_SYSTEM_PROMPT = """Eres Sententia, un asistente legal experto en la legislación chilena que responde de forma clara, concisa y objetiva.
Manten un tono neutral y humano, no uses emojis.
Cuando cites una fuente debes hacerlo explicando el contexto de una forma amigable al usuario no tecnico.
Responde la pregunta basándote estrictamente en el contexto legal proporcionado por el usuario en la conversacion.
Si la información no está en el contexto, indícalo claramente y sugiere al usuario que proporcione más información mediante la funcion 'Entrenar'.
No puedes responder preguntas que no tengan relación con la legislación chilena.
Debes citar la fuente del fragmento utilizado.

Contexto Legal:
{context}

Pregunta:
{question}

Respuesta (en español):"""


class LegalRAG:
    """clase que implementa la logica de RAG" mediante el uso de Ollama y ChromaDB"""

    def __init__(self):
        ollama_base_url = config("OLLAMA_BASE_URL", default="http://localhost:11434") #puerto por defecto del servicio de ollama #puerto por defecto del servicio de ollama
        llm_model = config("OLLAMA_LLM_MODEL", default="deepseek-r1:8b") #modelo de lenguaje para generar respuestas #modelo de lenguaje para generar respuestas
        embed_model = config("OLLAMA_EMBED_MODEL", default="mxbai-embed-large") #modelo de lenguaje para generar embeddings #modelo de lenguaje para generar embeddings
        self._bootstrap_enabled = config("RAG_BOOTSTRAP_DEFAULT_DATA", default=True, cast=bool)
        self._llm_model_name = llm_model
        self._embed_model_name = embed_model

        self.llm = ChatOllama(model=llm_model, base_url=ollama_base_url)
        self.embeddings = OllamaEmbeddings(model=embed_model)
        self._ollama_url = ollama_base_url
        self._vector_store: Chroma | None = None 

    def _is_ollama_running(self) -> bool:
        """Verifica si el servidor de Ollama está respondiendo."""
        try:
            # Intentamos una petición rápida al endpoint base
            with urllib.request.urlopen(self._ollama_url, timeout=2) as response:
                return response.status == 200
        except Exception:
            return False

    def _available_ollama_models(self) -> set[str]:
        """Obtiene los nombres de modelos disponibles en Ollama."""
        try:
            with urllib.request.urlopen(f"{self._ollama_url}/api/tags", timeout=3) as response:
                payload = json.loads(response.read().decode("utf-8"))
        except Exception:
            return set()

        models = payload.get("models", []) if isinstance(payload, dict) else []
        return {
            model.get("name")
            for model in models
            if isinstance(model, dict) and model.get("name")
        }


    def _require_model(self, model_name: str, purpose: str):
        """Falla con un error controlado si el modelo no está instalado."""
        available_models = self._available_ollama_models()
        
        # 1. Coincidencia exacta (ej: 'deepseek-r1:8b' == 'deepseek-r1:8b')
        if model_name in available_models:
            return

        # 2. Manejo de alias automáticos de Ollama (ej: 'modelo' -> 'modelo:latest')
        if ":" not in model_name and f"{model_name}:latest" in available_models:
            return

        # Si llegamos aquí, no encontramos el modelo exacto que el sistema intentará invocar.
        # Esto previene fallos 404 ocultos cuando se tiene una versión diferente (ej: 14b en vez de 8b).
        raise ModelDependencyError(model_name=model_name, purpose=purpose)

    def get_missing_models(self) -> list[dict]:
        """Retorna la lista de TODOS los modelos requeridos que no están en Ollama."""
        available = self._available_ollama_models()
        missing = []

        required = [
            (
                self._embed_model_name,
                "generar los vectores semánticos de los documentos legales",
            ),
            (
                self._llm_model_name,
                "redactar la respuesta final con base en el contexto recuperado",
            ),
        ]

        for model_name, purpose in required:
            if model_name in available:
                continue
            if ":" not in model_name and f"{model_name}:latest" in available:
                continue
            missing.append({"model": model_name, "purpose": purpose})

        return missing

    @property
    def vector_store(self) -> Chroma | None:
        """Carga la base de datos vectorial de forma diferida (lazy loading)."""
        if self._vector_store is None and os.path.exists(_CHROMA_DIR):
            self._vector_store = Chroma(
                persist_directory=_CHROMA_DIR,
                embedding_function=self.embeddings,
            )
        return self._vector_store

    @staticmethod
    def _load_documents(file_path: Path):
        """Carga documentos desde un archivo de texto o PDF."""
        suffix = file_path.suffix.lower()
        if suffix == ".pdf":
            loader = PyPDFLoader(str(file_path))
        elif suffix in (".txt", ".md"):
            loader = TextLoader(str(file_path), encoding="utf-8")
        else:
            return []
        return loader.load()

    def _default_seed_files(self) -> list[Path]:
        """Obtiene los archivos legales por defecto desde la carpeta data."""
        if not _DATA_DIR.exists():
            return []

        files = [
            path
            for path in _DATA_DIR.iterdir()
            if path.is_file() and path.suffix.lower() in _SUPPORTED_EXTENSIONS
        ]
        return sorted(files)

    def _bootstrap_default_data(self) -> bool:
        """Indexa automáticamente el corpus base si no hay documentos en Chroma."""
        if not self._bootstrap_enabled:
            return False

        self._require_model(
            self._embed_model_name,
            "transformar los documentos legales en vectores para poder buscarlos por significado",
        )

        files = self._default_seed_files()
        if not files:
            return False

        all_documents = []
        for file_path in files:
            all_documents.extend(self._load_documents(file_path))

        if not all_documents:
            return False

        splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
        splits = splitter.split_documents(all_documents)
        if not splits:
            return False

        self._vector_store = Chroma.from_documents(
            documents=splits,
            embedding=self.embeddings,
            persist_directory=_CHROMA_DIR,
        )
        return True

    def _ensure_seeded_vector_store(self):
        """Garantiza que exista una base vectorial con contenido por defecto."""
        vs = self.vector_store
        if vs and vs._collection.count() > 0:
            return

        self._bootstrap_default_data()

    def ingest_file(self, file_path: str) -> str:
        """
        Procesa e indexa un archivo legal (PDF o TXT) en la base de datos vectorial.

        Args:
            file_path: Ruta absoluta al archivo a procesar.

        Returns:
            Mensaje de éxito o error.
        """
        file = Path(file_path)
        if file.suffix.lower() not in _SUPPORTED_EXTENSIONS:
            return "Formato de archivo no soportado. Usa .pdf, .txt o .md"

        self._require_model(
            self._embed_model_name,
            "convertir el archivo en vectores y agregarlo a la memoria semántica del sistema",
        )

        documents = self._load_documents(file)
        splitter = RecursiveCharacterTextSplitter(chunk_size=1500, chunk_overlap=200)
        splits = splitter.split_documents(documents)

        vs = self.vector_store
        if vs and vs._collection.count() > 0:
            vs.add_documents(splits)
            self._vector_store = vs
        else:
            self._vector_store = Chroma.from_documents(
                documents=splits,
                embedding=self.embeddings,
                persist_directory=_CHROMA_DIR,
            )

        filename = os.path.basename(file_path)
        return f"Éxito: Se indexaron {len(splits)} fragmentos del archivo '{filename}'."

    def query(self, question: str) -> str:
        """
        Realiza una consulta al sistema RAG.

        Args:
            question: Pregunta en lenguaje natural.

        Returns:
            Respuesta generada por el LLM basada en los documentos legales.
        """
        # 1. Verificar si Ollama está corriendo
        if not self._is_ollama_running():
            return (
                "⚠️ El servidor de Ollama no responde. "
                "Asegúrate de que Ollama esté abierto y corriendo en tu equipo."
            )

        self._require_model(
            self._embed_model_name,
            "crear y consultar la memoria semántica de los documentos legales",
        )
        self._require_model(
            self._llm_model_name,
            "redactar la respuesta final con base en el contexto recuperado",
        )

        self._ensure_seeded_vector_store()

        # 2. Verificar si hay documentos indexados
        vs = self.vector_store
        # Si no existe el directorio o la colección está vacía
        if not vs or vs._collection.count() == 0:
            return (
                "📚 No tengo leyes en mi base de conocimiento todavía. "
                "Usa la funcion 'Entrenar' para agregar contenido legal"
            )

        retriever = vs.as_retriever(
            search_type="mmr",
            search_kwargs={"k": 10, "fetch_k": 20, "lambda_mult": 0.6},
        )
        prompt = ChatPromptTemplate.from_template(_SYSTEM_PROMPT)

        chain = (
            {"context": retriever | self._format_docs, "question": RunnablePassthrough()}
            | prompt
            | self.llm
            | StrOutputParser()
        )
        return chain.invoke(question)

    @staticmethod
    def _format_docs(docs) -> str:
        """Concatena el contenido de los documentos recuperados."""
        return "\n\n".join(doc.page_content for doc in docs)
