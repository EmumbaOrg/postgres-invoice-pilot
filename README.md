# PostgreSQL Solution Accelerator: Build your own advanced AI Copilot with Postgres

This solution accelerator is designed as an end-to-end example of an AI-enabled application built on Azure Postgres. It demonstrates the implementation of generative AI capabilities to enhance an existing application with AI-driven data validation, vector search, DiskANN, semantic re-ranking, LangChain agent/tools framework, and GraphRAG on Azure Database for PostgreSQL, and illustrates how they can be combined to deliver high quality responses to financial questions via an intelligent copilot. The app uses a small sample dataset made up of statements of work (SOWs) and invoices.

[![Open in GitHub Codespaces](https://img.shields.io/static/v1?style=for-the-badge&label=GitHub+Codespaces&message=Open&color=brightgreen&logo=github)](https://github.com/codespaces/new?hide_repo_select=true&ref=dev&repo=1013163299&machine=standardLinux32gb&devcontainer_path=.devcontainer%2Fdevcontainer.json&location=WestUs2)
[![Open in Dev Containers](https://img.shields.io/static/v1?style=for-the-badge&label=Dev%20Containers&message=Open&color=blue&logo=visualstudiocode)](https://vscode.dev/redirect?url=vscode://ms-vscode-remote.remote-containers/cloneInVolume?url=https://github.com/EmumbaOrg/postgres-sa-byoac)


> The full documentation for deploying and completing the workshop can be found here:
> <http://aka.ms/pg-byoac-docs/>

# Solution Accelerator Architecture:

![High-level architecture diagram for the solution](docs/workshop/docs/img/solution-architecture-diagram.png)

# Key Highlights

1. **LangChain Agent and Tool Framework:** Demonstrates how to build powerful LangChain-based Agents that interact with PostgreSQL and vector stores using Tools and Chains—bridging LLMs with data and application logic.
2. **Vector Search with RAG Pattern Built into PostgreSQL:** The solution enables in-database Retrieval-Augmented Generation (RAG) using the `pgvector` extension for efficient vector search, making PostgreSQL a powerful foundation for intelligent applications that combine structured data with generative AI.
3. **Semantic Re-ranking:** Enhances retrieval quality by applying semantic re-ranking with the `azure_ai.rank()` operator. After initial vector search, candidate results are re-ordered based on semantic relevance, ensuring that the most contextually appropriate information is surfaced for downstream AI tasks.
4. **GraphRAG with Apache AGE for Knowledge-Rich Context:** Extends RAG with GraphRAG, integrating `Apache AGE` (A Graph Extension for PostgreSQL) to enrich retrieval and grounding via knowledge graphs—ideal for complex relationships and semantic context.
5. **High-Performance DiskANN Index Integration:** Supports `DiskANN` (Disk-Accelerated Approximate Nearest Neighbor), offering scalable and fast vector similarity search, optimized for large datasets and low-latency retrieval directly within PostgreSQL.
6. **Azure AI Extension for PostgreSQL:** Leverages the Azure AI Extension, enabling direct embedding generation and model inference from Azure OpenAI or custom endpoints, eliminating the need for external model integration pipelines.
7. **Azure Storage Extension for Document-Linked Workflows:** Uses the Azure Storage Extension for PostgreSQL to access and retrieve unstructured content such as .csv and documents from Blob Storage directly inside PostgreSQL workflows.
8. **Document Intelligence Integration:** Integrates Azure Document Intelligence (formerly Form Recognizer) to extract structured content from documents—powering advanced data ingestion and enrichment scenarios for AI pipelines.
9. **Hands-On Learning Through Guided Labs:** The solution includes a comprehensive step-by-step hands-on guide with real-world examples—making it ideal for practitioners to learn by doing and gain practical experience with AI-native PostgreSQL patterns.

### 🛠️ Deployment Steps

#### Clone the Repository

Clone the repository. Once done, navigate to the repository:

```sh
git clone https://github.com/Azure-Samples/postgres-sa-byoac.git
cd postgres-sa-byoac
```

#### Log in to your Azure account

To log in to Azure CLI, use the following command. You can use the `--use-device-code` flag if the command fails.

```sh
az login
```

To log in to Azure Developer CLI, use this command. You can use the `--use-device-code` flag if the command fails.

```sh
azd auth login
```

#### Create a new Azure Developer environment

In the root of the project, execute the following command to create a new `azd` environment. Provide a name for your `azd` environment:

```sh
azd env new
```

#### **Windows Users Only – Grant permissions to azd hook scripts**

> **⚠️ IMPORTANT:** This step is **only** required if you are deploying from **Windows**.
> **Mac** and **Linux** users can skip this — nothing needs to be done.

If you are on **Windows**, run the following command in your current terminal session to allow execution of `pwsh` scripts located in the `azd-hooks` directory:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

```

#### Solution Deployment


1. Run the following command to provision the resources:

    ```sh
    azd up
    ```

    Once the above command is executed, the `azd` workflow prompts user to select the subscription for deployment and location.

2. Make sure that you have enough Azure OpenAI model quota in the region of deployment. **The `azd` workflow automatically filters and shows the region where the Azure OpenAI quota is available.** The Azure OpenAI quota required for `GlobalStandard` **deployment type** for this solution is listed below. This configuration can be changed from the `main.parameters.json` file in the `infra` directory using the following parameters:

    - **`GlobalStandard` GPT-4o:** 10K TPM - `AZURE_OPENAI_CHAT_DEPLOYMENT_CAPACITY`
    - **`GlobalStandard` text-embedding-ada-002:** 10K TPM - `AZURE_OPENAI_EMBED_DEPLOYMENT_CAPACITY`

    If you have changed the above parameters from the `main.parameters.json` file, you **must change** the following configuration in `main.bicep` file so that the changes are reflected in automatic Azure OpenAI region filtering as well:

    ```sh
    @metadata({
      azd: {
        type: 'location'
        usageName : [
          'OpenAI.GlobalStandard.gpt-4o, 10'
          'OpenAI.Standard.text-embedding-ada-002, 10'
        ]
      }
    })

    ```

3. Before the `azd` workflow proceeds, checks are performed in the selected infra region and recommendations are generated on failure for following cases to ensure that the deployment is successful.
    - Azure CLI login
    - Azure Flexible Server for PostgreSQL SKU [we recommend avoiding burstable instances as they might result in "Illegal Instruction" error in certain regions for vector queries]
    - Azure Container Apps quota
    - azd env name

The deployment might take several minutes. Progress updates will be displayed in the terminal and can also be tracked via the Azure Portal.

Once the deployment is complete, `azd` will output the **application URLs** for the deployed services.

### 🧹 Tear Down

To destroy all the resources that have been created in the steps above, as well as remove any accounts deployed by the solution accelerator, use the following command:

```sh
azd down --purge
```

The `--purge` flag deletes all the accounts permanently.