from typing import Any, Callable
from agent_framework import ChatAgent as AFChatAgent, ChatMessage as AFChatMessage, TextContent
from agent_framework.azure import AzureOpenAIChatClient
from langchain_openai import AzureOpenAIEmbeddings
from azure.identity.aio import DefaultAzureCredential, get_bearer_token_provider
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .interface import GenAIProviderBase

class AgentFrameworkProvider(GenAIProviderBase):
    """Concrete implementation of GenAIProviderBase for Agent Framework."""
    _chat_client: Any
    _embedding_client: Any
    _agent: Any

    def __init__(self, credential: DefaultAzureCredential, azure_config: dict[str, Any] = None):
        self.credential = credential
        self.azure_config = azure_config

    async def prepare_messages(self, messages: list[dict[str, str]]) -> Any:
        return [AFChatMessage(role=msg["role"], text=msg["content"]) for msg in messages]

    async def init_chat_client(self,  **kwargs) -> 'AgentFrameworkProvider':
        self._chat_client = AzureOpenAIChatClient(
            deployment_name=self.azure_config.get("chat_deployment_name", "completions"),
            endpoint=self.azure_config.get("api_endpoint"),
            api_version=self.azure_config.get("api_version"),
            ad_token_provider=await self.__get_token_provider(self.credential)
        )
        return self
    
    async def init_embedding_client(self, **kwargs) -> 'AgentFrameworkProvider':
        self._embedding_client = AzureOpenAIEmbeddings(
            azure_deployment=self.azure_config.get("embedding_deployment_name", "completions"),
            azure_endpoint=self.azure_config.get("api_endpoint"),
            azure_ad_token_provider=await self.__get_token_provider(self.credential)
        )
        return self

    async def build_agent(self, system_prompt: str, tools: list[Callable] | None = None, **kwargs) -> 'AgentFrameworkProvider':
        await self.init_chat_client()
        self._agent = AFChatAgent(chat_client=self._chat_client, instructions=system_prompt, tools=tools)
        return self

    async def run(self, user_message: str | None = None, messages: list[Any] = [], **kwargs) -> str:
        if user_message:
            messages.append({"role": "user", "content": user_message})
        messages = await self.prepare_messages(messages)
        result = await self._agent.run(messages)
        return str(result)
    
    async def aembed_query(self, text, **kwargs):
        embeddings = await self._embedding_client.aembed_query(text)
        return embeddings

    async def split_text(self, text: str, **kwargs) -> list[str]:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=kwargs.get("chunk_size", 500),
            chunk_overlap=kwargs.get("chunk_overlap", 50),
        )
        chunks = text_splitter.split_text(text)
        return chunks

    async def __get_token_provider(self, credential: DefaultAzureCredential) -> Any:
        return get_bearer_token_provider(credential, "https://cognitiveservices.azure.com/.default")
