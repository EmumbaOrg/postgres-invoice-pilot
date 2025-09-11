
from app.lifespan_manager import get_embedding_client
from fastapi import APIRouter, Depends

# Initialize the router
router = APIRouter(
    prefix = "",
    tags = ["Embeddings"],
    dependencies = [Depends(get_embedding_client)],
    responses = {404: {"description": "Not found"}}
)

@router.get('/embeddings', response_model = list[float])
async def generate_embeddings(text: str, client = Depends(get_embedding_client)):
    """Generate embeddings for the provided text using Azure OpenAI."""
    embeddings = await client.generate_embeddings(text)
    
    flat = embeddings.tolist()

    # Flatten if embeddings.tolist() returns a nested list
    if isinstance(flat[0], list):
        flat = flat[0]
    
    # convert embeddings to float
    embeddings = [float(x) for x in flat]

    return embeddings
