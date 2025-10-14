import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure

MONGO_HOST = os.getenv("MONGODB_HOST", "localhost")
MONGO_PORT = int(os.getenv("MONGODB_PORT", "27020"))
MONGO_DB_NAME = os.getenv("MONGODB_DATABASE", "internal_chatbot")
CHAT_COLLECTION = os.getenv("MONGODB_CHAT_COLLECTION", "chat_history")


MONGO_URI = f"mongodb://{MONGO_HOST}:{MONGO_PORT}"


def get_mongo_client() -> MongoClient:

    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        client.admin.command("ping")  # Quick ping to verify connection
        print(f"Connected to MongoDB at {MONGO_URI}")
        return client
    except ConnectionFailure as e:
        print(f"MongoDB connection failed: {e}")
        raise


def get_database():
 
    client = get_mongo_client()
    db = client[MONGO_DB_NAME]
    return db

def get_chat_collection():
    db = get_database()
    return db[CHAT_COLLECTION]

def clear_chat_history():
    coll = get_chat_collection()
    coll.delete_many({})
    print("🧹 Cleared chat history collection.")