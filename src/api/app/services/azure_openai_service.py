from azure.identity.aio import DefaultAzureCredential, get_bearer_token_provider
from agent_framework.azure import AzureOpenAIChatClient


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
        return AzureOpenAIChatClient(
            azure_deployment = self.embedding_deployment_name,
            azure_endpoint = self.azure_openai_endpoint,
            azure_ad_token_provider = await self.__get_token_provider()
        )
    
    async def get_chat_client(self):
        """Creates an Azure OpenAI chat client."""
        return AzureOpenAIChatClient(
            deployment_name = self.completion_deployment_name,
            endpoint = self.azure_openai_endpoint,
            api_version = self.azure_openai_api_version,
            azure_ad_token_provider = await self.__get_token_provider()
        )
    
    async def __get_token_provider(self):
        """Get a token provider for the Azure OpenAI service."""
        return get_bearer_token_provider(self.credential, "https://cognitiveservices.azure.com/.default")
