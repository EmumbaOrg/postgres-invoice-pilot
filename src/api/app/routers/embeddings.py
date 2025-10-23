
from app.lifespan_manager import get_genai_provider
from app.framework_providers.interface import FrameworkProviderBase
from fastapi import APIRouter, Depends

# Initialize the router
router = APIRouter(
    prefix = "",
    tags = ["Embeddings"],
    responses = {404: {"description": "Not found"}}
)

@router.get('/embeddings', response_model = list[float])
async def generate_embeddings(text: str, client: FrameworkProviderBase = Depends(get_genai_provider)):
    """Generate embeddings for the provided text using Azure OpenAI."""
    await client.init_embedding_client()
    return await client.aembed_query(text)
