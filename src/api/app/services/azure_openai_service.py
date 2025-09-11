from azure.identity.aio import DefaultAzureCredential, get_bearer_token_provider
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion, AzureTextEmbedding

class AzureOpenAIService:
    def __init__(self, credential: DefaultAzureCredential, openAiEndpoint: str):
        self.credential = credential

        # TODO: Get Azure OpenAI configuration from app configuration.
        self.azure_openai_endpoint = openAiEndpoint
        self.azure_openai_api_version = "2024-10-21"
        self.completion_deployment_name = "completions"
        self.embedding_deployment_name = "embeddings"

    async def get_embedding_client(self):
        """Creates an Azure OpenAI embedding client."""
        return AzureTextEmbedding(
            deployment_name = self.embedding_deployment_name,
            endpoint = self.azure_openai_endpoint,
            ad_token_provider = await self.__get_token_provider()
        )
    
    async def get_chat_client(self):
        """Creates an Azure OpenAI chat client."""
        return AzureChatCompletion(
            deployment_name = self.completion_deployment_name,
            endpoint = self.azure_openai_endpoint,
            api_version = self.azure_openai_api_version,
            ad_token_provider = await self.__get_token_provider()
        )
    
    async def __get_token_provider(self):
        """Get a token provider for the Azure OpenAI service."""
        return get_bearer_token_provider(self.credential, "https://cognitiveservices.azure.com/.default")
