from pdf_loader import load_pdf, split_text
from embeddings import create_embeddings
from vector_store import VectorStore

text = load_pdf("../uploads/jd_resume.pdf")

chunks = split_text(text)

embeddings = create_embeddings(chunks)

store = VectorStore()

store.create_index(embeddings, chunks)

query = "What programming languages are mentioned?"

query_embedding = create_embeddings([query])[0]

results = store.search(query_embedding)

print(results)