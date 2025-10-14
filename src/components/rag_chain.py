import os
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient
from pymongo import MongoClient
from langchain.memory import MongoDBChatMessageHistory, ConversationBufferMemory
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.runnables import RunnablePassthrough, RunnableMap
from langchain_core.output_parsers import StrOutputParser



MONGODB_HOST = os.getenv("MONGODB_HOST", "localhost")
MONGODB_PORT = os.getenv("MONGODB_PORT", "27020")
MONGODB_DATABASE = os.getenv("MONGODB_DATABASE", "internal_chatbot")

QDRANT_HOST = os.getenv("QDRANT_HOST", "localhost")
QDRANT_PORT = os.getenv("QDRANT_PORT", "6333")
QDRANT_COLLECTION = os.getenv("QDRANT_COLLECTION", "documents")

API_KEY = os.getenv("API_KEY", "")
CHAT_MODEL = os.getenv("CHAT_MODEL", "openai/gpt-oss-120b")
EMBED_MODEL = os.getenv("EMBED_MODEL", "BAAI/bge-base-en-v1.5")



# Build MongoDB URI
MONGO_URI = f"mongodb://{MONGODB_HOST}:{MONGODB_PORT}"

#
llm = ChatGroq(
    groq_api_key=API_KEY,
    model_name=CHAT_MODEL,
    temperature=0.0
)

# Embeddings + Vector Store
embeddings = HuggingFaceEmbeddings(model_name=EMBED_MODEL)
qdrant_client = QdrantClient(host=QDRANT_HOST, port=QDRANT_PORT)
vectorstore = QdrantVectorStore(
    client=qdrant_client,
    collection_name=QDRANT_COLLECTION,
    embedding=embeddings
)

# Retriever
retriever = vectorstore.as_retriever(search_type="similarity", search_kwargs={"k": 4})


# memory
def get_memory(session_id: str):
    chat_history = MongoDBChatMessageHistory(
        connection_string=MONGO_URI,
        session_id=session_id,
        database_name=MONGODB_DATABASE,
        collection_name="chat_history",
    )
    return ConversationBufferMemory(
        chat_memory=chat_history,
        memory_key="chat_history",
        return_messages=True
    )


# prompt
prompt = ChatPromptTemplate.from_template("""
You are a precise and context-aware AI assistant for the Internal RAG Chatbot.

Answer questions strictly based on the provided internal documents. 
If the context does not contain enough information, say clearly:
"I couldn’t find enough information in the internal knowledge base, I will now search the web for an answer."

Context:
{context}

Question:
{question}

Answer:
""")


# rag chain
def create_rag_chain(session_id: str):
    memory = get_memory(session_id)

    def get_chat_history(_):
        messages = memory.chat_memory.messages
        return "\n".join(
            [f"{m.type.capitalize()}: {m.content}" for m in messages]
        ) if messages else "No previous conversation."

    chain_inputs = RunnableMap({
        # "chat_history": get_chat_history,  # optional
        "context": retriever | (lambda docs: "\n\n".join([d.page_content for d in docs])),
        "question": RunnablePassthrough(),
    })

    rag_chain = chain_inputs | prompt | llm | StrOutputParser()
    return rag_chain
