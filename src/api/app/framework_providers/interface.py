from __future__ import annotations
from abc import ABC, abstractmethod
from typing import Any, Callable

class FrameworkProviderBase(ABC):
    """Abstract base class for GenAI provider integration."""

    @abstractmethod
    async def prepare_messages(self, messages: list[dict]) -> Any:
        pass

    @abstractmethod
    async def init_chat_client(self, credentials: Any, **kwargs) -> 'FrameworkProviderBase':
        pass
    
    @abstractmethod
    async def init_embedding_client(self, credentials: Any, **kwargs) -> 'FrameworkProviderBase':
        pass

    @abstractmethod
    async def build_agent(self, client: Any, system_prompt: str, tools: list[Callable] | None = None, **kwargs) -> 'FrameworkProviderBase':
        pass

    @abstractmethod
    async def run(self, agent: Any, user_message: str, messages: list[Any] = [], **kwargs) -> str:
        pass

    @abstractmethod
    async def aembed_query(self, text: str, **kwargs) -> str:
        pass

    @abstractmethod 
    async def split_text(self, text: str, **kwargs) -> list[str]:
        pass
