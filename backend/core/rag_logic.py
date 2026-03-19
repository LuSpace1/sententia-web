import os
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

_SYSTEM_PROMPT = """Eres Sententia, un asistente legal experto en la legislación chilena que responde de forma clara, concisa y objetiva.
Responde la pregunta basándote estrictamente en el contexto legal proporcionado por el usuario en la conversacion.
Si la información no está en el contexto, indícalo claramente y sugiere al usuario que proporcione más información.
No puedes responder preguntas que no tengan relación con la legislación chilena.

Contexto Legal:
{context}

Pregunta:
{question}

Respuesta (en español):"""


class LegalRAG:
    """
    Sistema de Recuperación Aumentada por Generación (RAG) para consultas legales chilenas.

    Utiliza Ollama (LLM local) y ChromaDB para responder preguntas basadas
    en documentos legales indexados previamente.
    """

    def __init__(self):
        ollama_base_url = config("OLLAMA_BASE_URL", default="http://localhost:11434") #puerto por defecto del servicio de ollama
        llm_model = config("OLLAMA_LLM_MODEL", default="deepseek-r1:8b") #modelo de lenguaje para generar respuestas
        embed_model = config("OLLAMA_EMBED_MODEL", default="mxbai-embed-large") #modelo de lenguaje para generar embeddings

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

    @property
    def vector_store(self) -> Chroma | None:
        """Carga la base de datos vectorial de forma diferida (lazy loading)."""
        if self._vector_store is None and os.path.exists(_CHROMA_DIR):
            self._vector_store = Chroma(
                persist_directory=_CHROMA_DIR,
                embedding_function=self.embeddings,
            )
        return self._vector_store

    def ingest_file(self, file_path: str) -> str:
        """
        Procesa e indexa un archivo legal (PDF o TXT) en la base de datos vectorial.

        Args:
            file_path: Ruta absoluta al archivo a procesar.

        Returns:
            Mensaje de éxito o error.
        """
        if file_path.lower().endswith(".pdf"):
            loader = PyPDFLoader(file_path)
        elif file_path.lower().endswith((".txt", ".md")):
            loader = TextLoader(file_path, encoding="utf-8")
        else:
            return "Formato de archivo no soportado. Usa .pdf, .txt o .md"

        documents = loader.load()
        splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=150)
        splits = splitter.split_documents(documents)

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

        # 2. Verificar si hay documentos indexados
        vs = self.vector_store
        # Si no existe el directorio o la colección está vacía
        if not vs or vs._collection.count() == 0:
            return (
                "📚 No tengo leyes en mi base de conocimiento todavía. "
                "Usa la funcion 'Entrenar' para agregar contenido legal"
            )

        retriever = vs.as_retriever(search_kwargs={"k": 3})
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
