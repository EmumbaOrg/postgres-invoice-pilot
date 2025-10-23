from typing import Any, Callable
from agent_framework import ChatAgent as AFChatAgent, ChatMessage as AFChatMessage
from agent_framework.azure import AzureOpenAIChatClient
from langchain_openai import AzureOpenAIEmbeddings
from azure.identity.aio import DefaultAzureCredential, get_bearer_token_provider
from langchain_text_splitters import RecursiveCharacterTextSplitter
from .interface import FrameworkProviderBase

class AgentFrameworkProvider(FrameworkProviderBase):
    """Concrete implementation of FrameworkProviderBase for Agent Framework."""
    _chat_client: AzureOpenAIChatClient = None
    _embedding_client: AzureOpenAIEmbeddings = None
    _agent: AFChatAgent = None

    def __init__(self, credential: DefaultAzureCredential, azure_config: dict[str, Any] = None):
        self.credential = credential
        self.azure_config = azure_config

    async def prepare_messages(self, messages: list[dict[str, str]]) -> Any:
        return [AFChatMessage(role=msg["role"], text=msg["content"]) for msg in messages]

    async def init_chat_client(self) -> 'AgentFrameworkProvider':
        if self._chat_client is None:
            self._chat_client = AzureOpenAIChatClient(
                deployment_name=self.azure_config.get("chat_deployment_name", "completions"),
                endpoint=self.azure_config.get("openai_api_endpoint"),
                api_version=self.azure_config.get("openai_api_version"),
                ad_token_provider=await self.__get_token_provider(self.credential)
            )
        return self
    
    async def init_embedding_client(self) -> 'AgentFrameworkProvider':
        if self._embedding_client is None:
            self._embedding_client = AzureOpenAIEmbeddings(
                azure_deployment=self.azure_config.get("embedding_deployment_name", "completions"),
                azure_endpoint=self.azure_config.get("openai_api_endpoint"),
                azure_ad_token_provider=await self.__get_token_provider(self.credential)
            )
        return self

    async def build_agent(self, system_prompt: str, tools: list[Callable] | None = None) -> 'AgentFrameworkProvider':
        await self.init_chat_client()
        self._agent = AFChatAgent(
            chat_client=self._chat_client, 
            instructions=system_prompt,
            tools=tools,
            temperature=self.azure_config.get("temperature", 0.0),
        )
        return self

    async def run(self, user_message: str | None = None, messages: list[Any] | None = None) -> str:
        messages = messages or []
        if user_message:
            messages.append({"role": "user", "content": user_message})
        messages = await self.prepare_messages(messages)
        result = await self._agent.run(messages)
        return str(result)

    async def chat(self, user_message: str, system_prompt: str) -> str:
        await self.init_chat_client()
        messages = await self.prepare_messages([{"role": "user", "content": user_message}])
        agent = self._chat_client.create_agent(instructions=system_prompt)
        response = await agent.run(messages)
        return str(response)

    async def aembed_query(self, text: str):
        embeddings = await self._embedding_client.aembed_query(text)
        return embeddings

    def split_text(self, text: str, **kwargs) -> list[str]:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=kwargs.get("chunk_size", 500),
            chunk_overlap=kwargs.get("chunk_overlap", 50),
        )
        chunks = text_splitter.split_text(text)
        return chunks

    async def __get_token_provider(self, credential: DefaultAzureCredential) -> Any:
        return get_bearer_token_provider(credential, "https://cognitiveservices.azure.com/.default")
