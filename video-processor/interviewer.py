from embedding_generator import get_embedding
import numpy as np
import openai

def query_video(question, index, segment_lookup, top_k=5):
    question_embedding = get_embedding(question)
    D, I = index.search(np.array([question_embedding]).astype('float32'), top_k)

    context = "\n".join([segment_lookup[i] for i in I[0]])

    prompt = f"""
You are an AI interviewer. Based on the following transcript, answer the question:
z
Transcript:
{context}

Question:
{question}

Answer:
"""

    response = openai.ChatCompletion.create(
        engine="gpt-4",
        messages=[
            {"role": "system", "content": "You are a helpful AI trained to answer questions from video transcripts."},
            {"role": "user", "content": prompt}
        ]
    )
    return response['choices'][0]['message']['content']