from __future__ import annotations
from typing import Any, Callable
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import StructuredTool
from langchain_openai import AzureChatOpenAI, AzureOpenAIEmbeddings
from azure.identity.aio import DefaultAzureCredential, get_bearer_token_provider
from langchain.text_splitter import RecursiveCharacterTextSplitter
from .interface import FrameworkProviderBase

class LangchainProvider(FrameworkProviderBase):
    """Concrete implementation of FrameworkProviderBase for Langchain."""
    _chat_client: Any
    _embedding_client: Any
    _agent: Any

    def __init__(self, credential: DefaultAzureCredential, azure_config: dict[str, Any]):
        self.credential = credential
        self.azure_config = azure_config

    def prepare_message(self, role: str, content: str) -> dict[str, str]:
        return {"role": role, "content": content}

    async def prepare_messages(self, messages: list[dict[str, Any]]) -> Any:
        return messages

    async def init_chat_client(self, **kwargs) -> Any:
        self._chat_client = AzureChatOpenAI(
            azure_deployment=self.azure_config.get("chat_deployment_name", "completions"),
            azure_endpoint=self.azure_config.get("openai_api_endpoint"),
            api_version=self.azure_config.get("openai_api_version"),
            temperature=self.azure_config.get("temperature", 0.0),
            azure_ad_token_provider=await self.__get_token_provider(self.credential)
        )
        return self

    async def init_embedding_client(self, **kwargs) -> Any:
        self._embedding_client = AzureOpenAIEmbeddings(
            azure_deployment=self.azure_config.get("embedding_deployment_name", "completions"),
            azure_endpoint=self.azure_config.get("openai_api_endpoint"),
            azure_ad_token_provider=await self.__get_token_provider(self.credential)
        )
        return self

    async def build_agent(self, system_prompt: str, tools: list[Callable] | None = None, **kwargs) -> Any:
        tools = await self.__prepare_tools(tools)
        await self.init_chat_client()
        prompt = ChatPromptTemplate.from_messages(
            [
                ("system", system_prompt),
                MessagesPlaceholder("chat_history", optional=True),
                ("user", "{input}"),
                MessagesPlaceholder("agent_scratchpad")
            ]
        )
        agent = create_openai_functions_agent(
            llm=self._chat_client,
            tools=tools,
            prompt=prompt,
        )
        self._agent = AgentExecutor(
            agent=agent,
            tools=tools,
            verbose=True,
            return_intermediate_steps=True
        )
        return self

    async def run(self, user_message: str, messages: list[Any] = [], **kwargs) -> str:
        result = await self._agent.ainvoke({"input": user_message, "chat_history": messages})
        return result["output"]
    
    async def aembed_query(self, text: str, **kwargs) -> str:
        embeddings = await self._embedding_client.aembed_query(text)
        return embeddings

    async def split_text(self, text: str, **kwargs) -> list[str]:
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=kwargs.get("chunk_size", 500),
            chunk_overlap=kwargs.get("chunk_overlap", 50),
        )
        chunks = text_splitter.split_text(text)
        return chunks

    async def __prepare_tools(self, tools: list[Callable]):
        return [StructuredTool.from_function(coroutine=tool) for tool in tools]

    async def __get_token_provider(self, credential: DefaultAzureCredential) -> Any:
        return get_bearer_token_provider(credential, "https://cognitiveservices.azure.com/.default")
