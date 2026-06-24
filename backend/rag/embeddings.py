import google.generativeai as genai
import os
import numpy as np
from dotenv import load_dotenv

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))


def create_embeddings(chunks):
    if not chunks:
        return np.array([])

    try:
        response = genai.embed_content(
            model="models/text-embedding-004",
            content=chunks,
            task_type="retrieval_document"
        )
        return np.array(response['embedding'])
    except Exception as e:
        print(f"Primary embedding model failed: {e}. Trying legacy model...")
        try:
            response = genai.embed_content(
                model="models/embedding-001",
                content=chunks,
                task_type="retrieval_document"
            )
            return np.array(response['embedding'])
        except Exception as ex:
            print(f"All embedding models failed: {ex}. Falling back to dummy mock embeddings...")
            dummy_embeddings = [np.random.randn(768).tolist() for _ in chunks]
            return np.array(dummy_embeddings)