# 2.6 Dev Environment Setup Overview

In this step, you will:

- [X] Observe how the dev environment is automatically setup in our application
- [X] Create and populate a `.env` file. [_Required only when running the application locally_]

## Automatic Dev Environment Setup

The required dependencies for both the backend and the frontend of the application are automatically installed when the devcontainer is being built.

In `.devcontainer/post-create-setup.ps1` file:

- The following command installs the backend python dependencies listed in the `src/api/requirements.txt` file.  

```bash
# Install API Python dependencies
pip3 install -r /workspaces/postgres-sa-byoac/src/api/requirements.txt
```

- The following installs the packages required for the frontend.  

```bash
# Install Frontend Node.js dependencies
Write-Host "Installing frontend dependencies..."
Set-Location /workspaces/postgres-sa-byoac/src/userportal
npm install
Write-Host "✅ Frontend dependencies installed"
```

Hence, you don't have to run any commands manually and the required dependencies were already installed when the devcontainer was built.

## Create .env file

To run the application locally, you need to create a `.env` file containing the necessary configuration variables that connect your local environment to your Azure resources.

1. Navigate to the `src/api` directory and create a new `.env` file.  
2. Use `src/api/.env.EXAMPLE` as a template to understand the required configuration variables. You need to populate your `.env` file with the actual values of these variables present in your backend azure container environment variables.

    `src/api/.env.EXAMPLE`:
    ![example .env](../img/example-env.png)

    !!! note "Locate Container app environment variables"
        Navigate to your resource group -> backend container app. Select `Application` from the left navigation menu. Then select `Containers` and go to the `Environment variables` tab.
        ![container environment variables.](../img/container-env-variables.png)

    - **AZURE_APP_CONFIG_ENDPOINT:** The endpoint for the azure app configuration service. Copy this from the container environment variables.
    - **GENAI_FRAMEWORK:** The AI framework to use for the application. Set this to either `langchain` or `agentframework` based on your preference. Default value is `agent-framework`. This variable is not found in the container environment variables and must be manually added to your `.env` file.
    - **CHAT_DEPLOYMENT_NAME:** The name of your Azure OpenAI chat model deployment. Copy this from the container environment variables.
    - **EMBEDDING_DEPLOYMENT_NAME:** The name of your Azure OpenAI embedding model deployment. Copy this from the container environment variables.
    - **OPENAI_API_VERSION:** The API version for Azure OpenAI service calls. Copy this from the container environment variables.
