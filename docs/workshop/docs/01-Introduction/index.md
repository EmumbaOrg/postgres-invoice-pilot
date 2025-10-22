# Introduction

The **Invoice Pilot** solution accelerator serves as a complete end-to-end example of an AI-enabled application for the financial services industry. It showcases how **generative AI** can be used to enhance existing enterprise systems with automated data validation, vector search, semantic ranking, and GraphRAG — all powered by **Azure Database for PostgreSQL** and **Azure AI Services**.  

The solution demonstrates how these capabilities can work together to deliver accurate, explainable, and context-aware responses to financial and contractual queries through an intelligent copilot interface.  

A small sample dataset of **Statements of Work (SOWs)** and **invoices** is included for demonstration. The complete source code for the accelerator is available here:  
👉 <http://aka.ms/pg-byoac-repo/>

---

## Application Architecture

The Invoice Pilot solution integrates a modern frontend, high-performance backend, and Azure-native AI services in a modular architecture designed for scalability and flexibility.

![High-level architecture diagram for the solution](../img/solution-architecture-diagram.png)

---

## Bringing Your Own Data

The accelerator is preconfigured with sample data for vendors, SOWs, and invoices. However, the solution is fully extensible for custom datasets.  

If you choose to adapt the accelerator for your own organization’s data, you can modify the ingestion pipeline, schema, and AI model prompts to suit your business context.  
The documentation includes notes identifying where such modifications may be required to ensure compatibility and optimal results.

---

## Key Learning Objectives

This solution guide is designed to help you understand how to enrich existing applications with **AI-driven intelligence** using **Azure Database for PostgreSQL** and **Azure AI Services**.  

By following this guide, you will gain a complete understanding of how Invoice Pilot integrates AI throughout its lifecycle — from ingestion and validation to interactive analysis — and how these techniques can be applied to your own workloads.

### You’ll Learn How to:

- **Automate Data Validation**  
  Use Azure AI Services during data ingestion to automatically validate invoices against their associated SOWs.

- **Integrate Generative AI with PostgreSQL**  
  Extend PostgreSQL with the [Azure AI extension](https://learn.microsoft.com/azure/postgresql/flexible-server/how-to-integrate-azure-ai) to enable vector search, embeddings, and in-database model inference.

- **Implement the RAG Pattern**  
  Use the [Retrieval Augmented Generation (RAG)](https://learn.microsoft.com/azure/ai-studio/concepts/retrieval-augmented-generation) approach to ground your copilot’s responses in your organization’s private data.

- **Deploy Scalable Applications**  
  Host containerized backend and frontend services using [Azure Container Apps](https://aka.ms/azcontainerapps) for production-ready deployment.

- **Use the Azure Developer CLI (azd)**  
  Streamline provisioning and deployment with [Azure Developer CLI](https://aka.ms/azd) and AI application templates for consistent multi-environment workflows.

---

## Learning Resources

To explore the services and concepts demonstrated in this accelerator, refer to the following resources:

1. **Azure Database for PostgreSQL – Flexible Server**  
   [Overview](https://learn.microsoft.com/azure/postgresql/flexible-server/service-overview)

2. **Generative AI with Azure Database for PostgreSQL – Flexible Server**  
   [Overview](https://learn.microsoft.com/azure/postgresql/flexible-server/generative-ai-overview)

3. **Azure AI Extension for PostgreSQL**  
   [Integration Guide](https://learn.microsoft.com/azure/postgresql/flexible-server/generative-ai-azure-overview)

4. **Azure AI Foundry**  
   [Documentation](https://learn.microsoft.com/azure/ai-studio/) · [Architecture](https://learn.microsoft.com/azure/ai-studio/concepts/architecture) · [SDKs](https://learn.microsoft.com/azure/ai-studio/how-to/develop/sdk-overview) · [Evaluation](https://learn.microsoft.com/azure/ai-studio/how-to/evaluate-generative-ai-app)

5. **Azure Container Apps**  
   [Overview](https://learn.microsoft.com/azure/container-apps/) · [Deploy from Code](https://learn.microsoft.com/azure/container-apps/quickstart-repo-to-cloud?tabs=bash%2Ccsharp&pivots=with-dockerfile)

6. **Responsible AI**  
   [Overview](https://www.microsoft.com/ai/responsible-ai) · [Responsible Use with AI Services](https://learn.microsoft.com/azure/ai-services/responsible-use-of-ai-overview?context=%2Fazure%2Fai-studio%2Fcontext%2Fcontext) · [Azure AI Content Safety](https://learn.microsoft.com/azure/ai-services/content-safety/)
