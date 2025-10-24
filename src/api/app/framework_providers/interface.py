from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Callable

class FrameworkProviderBase(ABC):
    """Abstract base class for GenAI provider integration."""

    @abstractmethod
    async def prepare_messages(self, messages: list[dict]) -> Any:
        pass

    @abstractmethod
    async def init_chat_client(self) -> 'FrameworkProviderBase':
        pass
    
    @abstractmethod
    async def init_embedding_client(self) -> 'FrameworkProviderBase':
        pass

    @abstractmethod
    async def build_agent(self, client: Any, system_prompt: str, tools: list[Callable] | None = None) -> 'FrameworkProviderBase':
        pass

    @abstractmethod
    async def run(self, agent: Any, user_message: str, messages: list[Any] | None = None) -> str:
        pass

    @abstractmethod
    async def chat(self, user_message: str, system_prompt: str) -> str:
        pass

    @abstractmethod
    async def aembed_query(self, text: str) -> str:
        pass

    @abstractmethod 
    def split_text(self, text: str, **kwargs) -> list[str]:
        pass
