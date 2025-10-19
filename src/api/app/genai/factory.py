from .agentframework_provider import AgentFrameworkProvider
from .langchain_provider import LangchainProvider
from azure.identity.aio import DefaultAzureCredential

class GenAIProviderFactory:
    """Factory to select and instantiate GenAI provider implementation."""
    def __init__(self, provider: str = "agentframework", credential = None, azure_config: dict = None):
        self.provider = provider.lower()
        self.credential = credential or DefaultAzureCredential()
        self.azure_config = azure_config

    def get_provider_service(self):
        if self.provider in ["agentframework", "agent-framework"]:
            return AgentFrameworkProvider(self.credential, self.azure_config)
        elif self.provider in ["langchain", "lang-chain"]:
            return LangchainProvider(self.credential, self.azure_config)
        else:
            raise ValueError(f"Unknown GenAI provider: {self.provider}")
