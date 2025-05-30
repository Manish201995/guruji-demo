from cassandra.cluster import Cluster
from cassandra.auth import PlainTextAuthProvider
import uuid
import numpy as np

# Configuration
SECURE_BUNDLE_PATH = 'secure-connect-alakhai-staging-mumbai.zip'
ASTRA_DB_USERNAME = 'token'
ASTRA_DB_PASSWORD = 'AstraCS:atXgQPoDamfMePZbQXfGfpIX:d83374809e382003c71412e4a355e3208350dccb209a6f777323f89dc8ea9158'
KEYSPACE = 'dev_alakh_ai'
TABLE_NAME = 'siddhant_test_embeddings'

# Connect to Astra DB
cloud_config = {'secure_connect_bundle': SECURE_BUNDLE_PATH}
auth_provider = PlainTextAuthProvider(ASTRA_DB_USERNAME, ASTRA_DB_PASSWORD)
cluster = Cluster(cloud=cloud_config, auth_provider=auth_provider)
session = cluster.connect()
session.set_keyspace(KEYSPACE)

# Step 1: Create the table (only run once)
session.execute(f"""
    CREATE TABLE IF NOT EXISTS {TABLE_NAME} (
        id UUID PRIMARY KEY,
        text TEXT,
        embedding LIST<FLOAT>
    )
""")

# Step 2: Sample data and embedding (e.g., 1536-dim vector)
text_sample = "A quick brown fox jumps over the lazy dog."
embedding_sample = np.random.rand(1536).astype(float).tolist()  # Replace with real model output

# Step 3: Insert data into Cassandra
session.execute(
    f"INSERT INTO {TABLE_NAME} (id, text, embedding) VALUES (%s, %s, %s)",
    (uuid.uuid4(), text_sample, embedding_sample)
)

# Step 4: Query and print stored embedding
rows = session.execute(f"SELECT text, embedding FROM {TABLE_NAME} LIMIT 1")
for row in rows:
    print("Stored Text:", row.text)
    print("Embedding (first 10 dims):", row.embedding[:10])  # Truncated for readability
    
    
