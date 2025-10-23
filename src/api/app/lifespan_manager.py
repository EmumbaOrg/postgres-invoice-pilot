import os
from app.framework_providers.interface import FrameworkProviderBase
from app.services import (
    AzureDocIntelligenceService,
    ConfigService,
    DatabaseService,
    PromptService,
    StorageService,
    ActivityLogService
)
from azure.identity.aio import DefaultAzureCredential
from azure.core.credentials import AzureKeyCredential
from contextlib import asynccontextmanager
from app.framework_providers.factory import FrameworkProviderFactory


# Create a global async Azure OpenAI
aoai_service = None
# Create a global async Microsoft Entra ID RBAC credential
credential = None
# Create a global async PostgreSQL db connection
db = None
# Create a global async AppConfig
config_service = None
# Create a global async StorageService
storage_service = None
# Create a global async Azure Document Intelligence Service client
doc_intelligence_service = None
# Create a global PromptService
prompt_service = None
# Create a global ActivityLogService
activity_log_service = None
# Create a global GenAI provider
genai_provider = None

@asynccontextmanager
async def lifespan(app):
    """Async context manager for the FastAPI application lifespan."""
    global aoai_service
    global config_service
    global credential
    global db
    global doc_intelligence_service
    global storage_service
    global prompt_service
    global activity_log_service
    global genai_provider

    # Create an async Microsoft Entra ID RBAC credential
    credential = DefaultAzureCredential()

    # Create ConfigService instance
    config_service = ConfigService(credential)
    
    framework_config = {
        "chat_deployment_name": os.getenv("CHAT_DEPLOYMENT_NAME"),
        "embedding_deployment_name": os.getenv("EMBEDDING_DEPLOYMENT_NAME"),
        "openai_api_version": os.getenv("OPENAI_API_VERSION"),
        "openai_api_endpoint": await config_service.get_openai_endpoint(),
    }
    genai_framework = os.getenv("GENAI_FRAMEWORK", "agent-framework")
    genai_provider_factory = FrameworkProviderFactory(
        provider=genai_framework,
        azure_config=framework_config,
    )
    genai_provider = genai_provider_factory.get_provider_service()

    # Create an async Azure Document Intelligence Service client
    doc_intelligence_credential = AzureKeyCredential(await config_service.get_doc_intelligence_key())
    doc_intelligence_service = AzureDocIntelligenceService(doc_intelligence_credential, await config_service.get_doc_intelligence_endpoint())

    # Create an async Azure Blob Service client
    storage_service = StorageService(credential, await config_service.get_storage_account(), config_service.get_document_container_name())

    # Create a connection to the Azure Database for PostgreSQL server
    db = DatabaseService(credential, await config_service.get_postgresql_server_name(), await config_service.get_postgresql_database_name())

    # Create an ActivityLogService
    activity_log_service = ActivityLogService()

    # Create a prompt service
    prompt_service = PromptService()

    yield

    # Close the database connection
    await db.close()

    # Close the ConfigService
    await config_service.close()

    # Close the async Microsoft Entra ID RBAC credential
    await credential.close()

# Provide methods for retrieving the global async objects from the lifespan manager.
async def get_config_service():
    return config_service

async def get_credential():
    return credential

async def get_azure_doc_intelligence_service():
    return doc_intelligence_service
    
async def get_storage_service():
    return storage_service

async def get_db_connection_pool():
    return await db.get_connection_pool()

async def get_prompt_service():
    return prompt_service

async def get_activity_log_service():
    return activity_log_service

async def get_genai_provider() -> FrameworkProviderBase:
    return genai_provider
