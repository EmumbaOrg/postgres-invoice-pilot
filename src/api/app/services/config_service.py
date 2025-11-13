from azure.identity.aio import DefaultAzureCredential
from azure.appconfiguration.aio import AzureAppConfigurationClient
from azure.keyvault.secrets.aio import SecretClient
from azure.core.exceptions import ResourceNotFoundError
import os
import json
import asyncio
from typing import Dict, Optional

# Usage example:
# appConfig = AppConfig(os.getenv("AZURE_KEY_VAULT_NAME"))
# secret_value = appConfig.get_secret("my-secret")
# postgresql_server_name = appConfig.get_postgresql_server_name()

class ConfigService:
    def __init__(self, credential: DefaultAzureCredential, app_config_endpoint: str = None):
        self.credential = credential

        self.app_config_endpoint = app_config_endpoint
        if self.app_config_endpoint is None:
            self.app_config_endpoint = os.getenv("AZURE_APP_CONFIG_ENDPOINT")
        
        self.client: Optional[AzureAppConfigurationClient] = None
        
        # Cache for Key Vault clients to avoid creating them repeatedly
        self._keyvault_clients: Dict[str, SecretClient] = {}
        self._client_lock = asyncio.Lock()
        self._is_initialized = False

    async def _initialize(self):
        """Initialize the App Configuration client if not already done."""
        if not self._is_initialized:
            async with self._client_lock:
                if not self._is_initialized:
                    self.client = AzureAppConfigurationClient(
                        self.app_config_endpoint, 
                        credential=self.credential,
                    )
                    self._is_initialized = True

    async def close(self):
        """Close all clients and clean up resources."""
        # Close all cached Key Vault clients first
        for vault_client in self._keyvault_clients.values():
            if vault_client:
                try:
                    await vault_client.close()
                except Exception:
                    pass  # Ignore errors during cleanup
        self._keyvault_clients.clear()
        
        if self.client:
            try:
                await self.client.close()
            except Exception:
                pass  # Ignore errors during cleanup
            self.client = None
            
        self._is_initialized = False

    async def _get_keyvault_client(self, vault_url: str) -> SecretClient:
        """
        Get or create a cached Key Vault client for the specified vault URL.
        """
        if vault_url not in self._keyvault_clients:
            async with self._client_lock:
                # Double-check pattern to avoid race conditions
                if vault_url not in self._keyvault_clients:
                    self._keyvault_clients[vault_url] = SecretClient(
                        vault_url=vault_url, 
                        credential=self.credential,
                    )
        return self._keyvault_clients[vault_url]

    async def __get_setting(self, key: str) -> str:
        # Ensure the client is initialized
        await self._initialize()
        
        try:
            setting = await self.client.get_configuration_setting(key=key)
            
            value = setting.value

            if setting.content_type == "application/vnd.microsoft.appconfig.keyvaultref+json;charset=utf-8":
                # Load value from Key Vault
                try:
                    key_vault_reference_json = json.loads(value)
                    key_vault_url = key_vault_reference_json["uri"]
                    vault_base_url = f"https://{key_vault_url.split('/')[2]}"
                    key_vault_client = await self._get_keyvault_client(vault_base_url)
                    secret_name = key_vault_url.split('/')[-1]
                    secret = await key_vault_client.get_secret(secret_name)
                    value = secret.value
                except (json.JSONDecodeError, KeyError, ValueError) as e:
                    print(f"Failed to parse Key Vault reference for setting '{key}': {e}")
                    raise Exception(f"Invalid Key Vault reference format for setting '{key}'")
                except Exception as e:
                    print(f"Failed to retrieve Key Vault secret for setting '{key}': {e}")
                    raise Exception(f"Failed to retrieve Key Vault secret for setting '{key}': {e}")

            return value
        except ResourceNotFoundError:
            print(f"Setting '{key}' not found in Azure App Configuration")
            raise Exception(f"Setting '{key}' not found in Azure App Configuration.")

    async def get_openai_endpoint(self) -> str:
        return await self.__get_setting("openai-endpoint")

    async def get_postgresql_server_name(self) -> str:
        return await self.__get_setting("postgresql-server")
    
    async def get_postgresql_database_name(self) -> str:
        return await self.__get_setting("postgresql-database")

    async def get_storage_account(self) -> str:
        return await self.__get_setting("storage-account")

    async def get_doc_intelligence_key(self) -> str:
        return await self.__get_setting("doc-intelligence-key")

    async def get_doc_intelligence_endpoint(self) -> str:
        return await self.__get_setting("doc-intelligence-endpoint")
    
    def get_chat_model_deployment(self) -> str:
        return "completions"
    
    def get_embedding_model_deployment(self) -> str:
        return "embeddings"
    
    def get_document_container_name(self) -> str:
        return "documents"
