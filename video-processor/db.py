from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", 'mongodb://mongo-proxy-stage.penpencil.co:27015/guruji')
DB_NAME = 'guruji'

# Initialize MongoDB client
client = MongoClient(MONGO_URI)
db = client[DB_NAME]

def save_document(document: dict):
    collection = db["transcripts"]
    result = collection.insert_one(document)
    print(f"✅ Document inserted with _id: {result.inserted_id}")
    return result

def get_document_by_videoid(doc_id: str):
    collection = db["transcripts"]
    document = collection.find_one({"videoId": doc_id})
    if document:
        document["_id"] = str(document["_id"])  # Convert ObjectId to string
        print(f"✅ Document found: {document}")
    else:
        print("❌ Document not found")
    return document
