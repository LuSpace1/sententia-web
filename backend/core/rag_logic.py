import os
import json
import urllib.request
from pathlib import Path

from decouple import config
from langchain_chroma import Chroma
from langchain_community.document_loaders import PyPDFLoader, TextLoader
from langchain_core.messages import AIMessage, HumanMessage
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.runnables import RunnableLambda, RunnablePassthrough
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

# Prompt para reformular preguntas de seguimiento como preguntas independientes
_CONTEXTUALIZE_PROMPT = """Dado el historial de conversación y la última pregunta del usuario,
que puede hacer referencia a mensajes anteriores, reformula la pregunta de forma que sea
comprensible por sí sola sin necesitar el historial. Si ya es independiente, devuélvela tal cual.
NO respondas la pregunta, solo reformúlala si es necesario."""

# Prompt del sistema para la respuesta final
_SYSTEM_PROMPT = """Eres Sententia, un asistente legal de alta precisión experto en legislación chilena.

REGLAS CRÍTICAS:
1. GROUNDING ESTRICTO: Basa tu respuesta PRINCIPALMENTE en el "Contexto Legal" proporcionado.
2. PROHIBICIÓN DE INVENTAR: Nunca inventes números de artículos, nombres de leyes ni sanciones específicas que no estén en el contexto. Si debes mencionar datos que no están en el contexto, indícalo explícitamente con: "(dato no encontrado en el contexto provisto)".
3. RESPUESTA PARCIAL PERMITIDA: Si el contexto solo tiene información parcial, responde con lo que tienes e indica qué aspectos no pudieron ser verificados en el contexto disponible.
4. CITAS OBLIGATORIAS: Cuando el contexto contenga un artículo o ley específica, cítala entre corchetes: [Código Penal, Art. 14].
5. PRIORIZACIÓN: Si encuentras información contradictoria, prioriza las Leyes Especiales sobre los Códigos Generales.
6. TONO: Profesional, técnico y directo. Sin introducciones innecesarias.

Contexto Legal:
{context}"""


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

        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1600,
            chunk_overlap=200,
            separators=[
                "\nARTÍCULO", "\nArtículo", "\nArt.",
                "\nTÍTULO", "\nTítulo",
                "\nLIBRO", "\nLibro",
                "\n\n", "\n", " ", ""
            ]
        )
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
        splitter = RecursiveCharacterTextSplitter(
            chunk_size=1600,
            chunk_overlap=200,
            separators=[
                "\nARTÍCULO", "\nArtículo", "\nArt.",
                "\nTÍTULO", "\nTítulo",
                "\nLIBRO", "\nLibro",
                "\n\n", "\n", " ", ""
            ]
        )
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

    def query(self, question: str, chat_history: list | None = None) -> str:
        """
        Realiza una consulta al sistema RAG.

        Args:
            question: Pregunta en lenguaje natural.

        Returns:
            Respuesta generada por el LLM basada en los documentos legales.
        """
        chat_history = chat_history or []
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
            search_kwargs={"k": 8, "fetch_k": 20, "lambda_mult": 0.5},
        )

        # Limitar historial a los últimos 4 turnos (2 exchanges) para no saturar el contexto
        MAX_HISTORY_TURNS = 4
        trimmed_history = chat_history[-MAX_HISTORY_TURNS:] if len(chat_history) > MAX_HISTORY_TURNS else chat_history

        # --- Paso 1: Reformular la pregunta si hay historial ---
        # Si el usuario pregunta "Es igual para todos?", el LLM lo convierte en
        # "Los 15 días de feriado del Art. 67 aplican igual para todos los trabajadores?"
        contextualize_prompt = ChatPromptTemplate.from_messages([
            ("system", _CONTEXTUALIZE_PROMPT),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])
        contextualize_chain = contextualize_prompt | self.llm | StrOutputParser()

        def contextualized_retriever(input_dict: dict):
            """Reformula la pregunta con el historial y luego busca en ChromaDB."""
            if input_dict.get("chat_history"):
                reformulated = contextualize_chain.invoke(input_dict)
                return retriever.invoke(reformulated)
            return retriever.invoke(input_dict["input"])

        # --- Paso 2: Cadena de respuesta con contexto e historial ---
        qa_prompt = ChatPromptTemplate.from_messages([
            ("system", _SYSTEM_PROMPT),
            MessagesPlaceholder("chat_history"),
            ("human", "{input}"),
        ])

        chain = (
            RunnablePassthrough.assign(
                context=RunnableLambda(
                    lambda x: self._format_docs(contextualized_retriever(x))
                )
            )
            | qa_prompt
            | self.llm
            | StrOutputParser()
        )

        return chain.invoke({"input": question, "chat_history": trimmed_history})

    @staticmethod
    def _format_docs(docs) -> str:
        """Concatena el contenido de los documentos recuperados."""
        return "\n\n".join(doc.page_content for doc in docs)
