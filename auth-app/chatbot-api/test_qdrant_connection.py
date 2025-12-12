from qdrant_client import QdrantClient
import os

QDRANT_URL = "https://95f917bd-5eae-4a33-bb5b-01706d914e55.europe-west3-0.gcp.cloud.qdrant.io"
QDRANT_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.vGM2WFJKbHspSDW2Lw_zGMKEAE2aV_8JMOZQU6Y_Blo"

def test_qdrant_connection():
    try:
        client = QdrantClient(
            url=QDRANT_URL,
            api_key=QDRANT_API_KEY,
        )
        
        # Attempt to get a list of collections to verify connectivity
        collections = client.get_collections()
        print("Qdrant connection successful! Existing collections:")
        for collection in collections.collections:
            print(f"- {collection.name}")
        
    except Exception as e:
        print(f"Qdrant connection failed: {e}")

if __name__ == "__main__":
    test_qdrant_connection()