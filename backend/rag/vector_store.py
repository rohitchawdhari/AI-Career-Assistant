import faiss
import numpy as np


class VectorStore:

    def __init__(self):
        self.index = None
        self.chunks = []
        self.full_text = ""

    def create_index(self, embeddings, chunks, full_text=""):

        dimension = embeddings.shape[1]

        self.index = faiss.IndexFlatL2(dimension)

        self.index.add(
            np.array(embeddings).astype("float32")
        )

        self.chunks = chunks
        self.full_text = full_text

    def get_full_text(self):
        if hasattr(self, "full_text") and self.full_text:
            return self.full_text
        return "\n".join(self.chunks)

    def search(self, query_embedding, top_k=3):

        distances, indices = self.index.search(
            np.array([query_embedding]).astype("float32"),
            top_k
        )

        results = []

        for idx in indices[0]:
            if idx != -1:
                results.append(self.chunks[idx])

        return results


vector_store = VectorStore()