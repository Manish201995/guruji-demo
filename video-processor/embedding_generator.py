import math
import uuid
import numpy as np
from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
import openai
import db

# === CONFIGURATION ===

# Astra DB (Cassandra) config
SECURE_BUNDLE_PATH = 'secure-connect-alakhai-staging-mumbai.zip'
ASTRA_DB_USERNAME = 'token'
ASTRA_DB_PASSWORD = 'AstraCS:atXgQPoDamfMePZbQXfGfpIX:d83374809e382003c71412e4a355e3208350dccb209a6f777323f89dc8ea9158'
KEYSPACE = 'dev_alakh_ai'
TABLE_NAME = 'siddhant_test_embeddings12'

# OpenAI-compatible proxy config (LiteLLM)
client = openai.OpenAI(
    api_key="sk-z6Gd3ZjZcdbEx_x5zrlI6Q",
    base_url="https://litellm-data.penpencil.co"
)

cloud_config = {'secure_connect_bundle': SECURE_BUNDLE_PATH}
auth_provider = PlainTextAuthProvider(ASTRA_DB_USERNAME, ASTRA_DB_PASSWORD)
cluster = Cluster(cloud=cloud_config, auth_provider=auth_provider)
session = cluster.connect()
session.set_keyspace(KEYSPACE)
# === FUNCTIONS ===

def get_embedding(text: str) -> list[float]:
    """Generates embedding using LiteLLM proxy and OpenAI-compatible API."""
    response = client.embeddings.create(
        input=text,
        model="text-embedding-3-small",
        dimensions=1536,
        extra_query={'query': 'Provide embeddiing according to text'},
    )
    # print(f"Embedding response: {response}")
    return response.data[0].embedding


def store_embedding(id: str, segmentText: str, embedding: list[float], session, videoId, start_time: str = None, duration: str = None):

    # Create the table if not exists
    session.execute(f"""
        CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
            videoid TEXT,
            id UUID,
            text TEXT,
            embedding LIST<FLOAT>,
            start_time TEXT,
            duration TEXT,
            PRIMARY KEY (videoid, id)
        )
    """)

    """Stores the text and its embedding into Cassandra."""
    session.execute(
        f"INSERT INTO {TABLE_NAME} (id, text, embedding, start_time, duration, videoid) VALUES (%s, %s, %s, %s, %s, %s)",
        (
            id,
            segmentText,
            embedding,
            start_time if start_time else None,
            duration if duration else None,
            videoId
        )
    )

def getEmbeddingFromDbById(id: str, session):
    rows = session.execute(f"SELECT id, text, embedding, start_time, duration, videoid FROM {TABLE_NAME} WHERE videoid = %s", (id,))
    return rows.all()



# === MAIN EXECUTION ===

# if __name__ == "__main__":
#     text_sample = "A quick brown fox jumps over the lazy dog."
#     embedding = get_embedding(text_sample)
#     store_embedding(text_sample, embedding)
#     print("✅ Embedding stored successfully.")
    
    
def addDataToDb(id: str, segments, videoId):
    print(id, videoId)
    try:
        cloud_config = {'secure_connect_bundle': SECURE_BUNDLE_PATH}
        auth_provider = PlainTextAuthProvider(ASTRA_DB_USERNAME, ASTRA_DB_PASSWORD)
        cluster = Cluster(cloud=cloud_config, auth_provider=auth_provider)
        session = cluster.connect()
        session.set_keyspace(KEYSPACE)
        """Adds transcript segments to the database."""
        for segment in segments:
            segment_text = f"topic: {segment['topic']}, transcript: {segment['transcript']}, start_time: {segment['start_time']}, duration: {segment['duration']}"
            embedding = get_embedding(segment_text)
            store_embedding(uuid.uuid4(), segment_text, embedding, session, videoId, segment['start_time'], segment['duration'])  # <-- pass segment, not segment_text
            data = getEmbeddingFromDbById(videoId, session)
            print(f"✅ Stored: {data}")
    except Exception as e:
        print(f"❌ Error storing data: {e}")
        

def timestamp_to_seconds(timestamp: str) -> float:
    """
    Convert a timestamp string (like '01:23:45' or '01:23.45') to seconds.
    Supports formats: 'HH:MM:SS', 'MM:SS', 'SS'
    """
    parts = timestamp.replace('.', ':').split(':')
    
    # Convert parts to seconds based on their position
    if len(parts) == 3:  # HH:MM:SS or MM:SS.SS
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    elif len(parts) == 2:  # MM:SS
        return int(parts[0]) * 60 + float(parts[1])
    else:  # SS
        return float(parts[0])


# def cosine_similarity(vec1, vec2):
#     """Compute cosine similarity between two vectors."""
#     dot = sum(a * b for a, b in zip(vec1, vec2))
#     norm1 = math.sqrt(sum(a * a for a in vec1))
#     norm2 = math.sqrt(sum(b * b for b in vec2))
#     return dot / (norm1 * norm2) if norm1 and norm2 else 0


# def search_segments(session, videoId: str, query_text: str = None, time_window_sec: float = 30.0, top_k: int = 5):
#     """
#     Search segments by timestamp only or timestamp + topic/text.
#     """
#     # query_seconds = timestamp_to_seconds(timestamp)
#     query_embedding = get_embedding(query_text) if query_text else None

#     # Fetch all segments from DB
#     rows = session.execute(f"SELECT id, transcript, topic, start_time, embedding FROM {TABLE_NAME} WHERE videoid = %s", (videoId,))
#     matches = []

#     for row in rows:
#         # Parse time from row.text (assuming it's like: '00.06 00.20 Topic Text ...')
#         # parts = row.transcript.split(" ", 3)
#         # if len(parts) < 3:
#         #     continue
#         # print(row)

#         start_time_str = row.start_time
#         topic = row.topic
#         transcript = row.transcript
#         # start_sec = timestamp_to_seconds(start_time_str)

#         # Filter by time window
#         # if abs(start_sec - query_seconds) <= time_window_sec:
#         similarity = cosine_similarity(query_embedding, row.embedding) if query_embedding else None
#         matches.append({
#             "id": row.id,
#             "start_time": start_time_str,
#             "topic": topic,
#             "transcript": transcript,
#             "similarity": similarity
#         })

#     # Sort by similarity if using query_text
#     if query_embedding:
#         matches.sort(key=lambda x: x["similarity"], reverse=True)

#     return matches


# timestamp = "05.17"
# videoId = "0peBVJuZXKE"


# # 1. Just search by time
# # results_by_time = search_segments(session, videoId, timestamp)
# # print("🔍 Results by time only:", results_by_time)
# # for r in results_by_time:
# #     print()

# # 2. Search by time + topic/text
# results_by_topic = search_segments(session, videoId, query_text="refractive index")
# print("\n🔍 Results by time + topic:")
# for r in results_by_topic:
#     print(f"[{r['start_time']}] {r['topic']} → Score: {r['similarity']:.2f}")



import math

def cosine_similarity(vec1, vec2):
    """Compute cosine similarity between two vectors."""
    dot = sum(a * b for a, b in zip(vec1, vec2))
    norm1 = math.sqrt(sum(a * a for a in vec1))
    norm2 = math.sqrt(sum(b * b for b in vec2))
    return dot / (norm1 * norm2) if norm1 and norm2 else 0


def vector_search_by_text(videoId: str, query_text: str, top_k: int = 5):
    """
    Perform vector similarity search based on query_text across all segments.
    """
    # 1. Get embedding of user query
    query_embedding = get_embedding(query_text)

    # 2. Fetch all rows from DB
    rows = session.execute(
        f"SELECT id, text, embedding, start_time, duration, videoid FROM {TABLE_NAME} WHERE videoid = %s", (videoId,)
    )

    # 3. Score and rank
    matches = []
    for row in rows:
        similarity = cosine_similarity(query_embedding, row.embedding)
        matches.append({
            "id": row.id,
            "text": row.text,
            "start_time": row.start_time,
            "duration": row.duration,
            "videoid": row.videoid,
            "similarity": similarity
        })

    # 4. Return top-k most similar results
    matches.sort(key=lambda x: x["similarity"], reverse=True)
    return matches


# video_id = "0peBVJuZXKE"
# query = "Sir Optical density kya hai?"

# results = vector_search_by_text(session, video_id, query)

# print("\n🔍 Top Matches:")
# for result in results:
#     print(f"\n🧠 Similarity: {result['similarity']:.2f}")
#     print(result["text"])
# print(f"Total matches found: {len(results)}")

# sjnsj = getEmbeddingFromDbById("0peBVJuZXKE",session)
# print(sjnsj)