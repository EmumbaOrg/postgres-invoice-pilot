from azure.core.credentials import AzureKeyCredential
from azure.ai.formrecognizer.aio import DocumentAnalysisClient
from azure.core.exceptions import AzureError
from typing import List
from datetime import date, datetime
import re
import json
import asyncio

from app.framework_providers.interface import FrameworkProviderBase

class TextChunk:
    heading: str
    content: str
    page_number: int

class DocumentAnalysisResult:
    extracted_text: str
    text_chunks: List[TextChunk]

class InvoiceLineItem:
    description: str
    amount: str
    due_date: date
    status: str

class InvoiceDocumentAnalysisResult(DocumentAnalysisResult):
    line_items: List[InvoiceLineItem]


class AzureDocIntelligenceService:
    def __init__(self, credential: AzureKeyCredential, docIntelligenceEndpoint: str):
        self.credential = credential
        self.docIntelligenceEndpoint = docIntelligenceEndpoint
        self._client = None
        self._client_lock = asyncio.Lock()

    async def close(self):
        """Close the document analysis client."""
        if self._client:
            await self._client.close()
            self._client = None

    async def _get_client(self) -> DocumentAnalysisClient:
        """
        Get or create a DocumentAnalysisClient instance.
        """
        if self._client is None:
            async with self._client_lock:
                # Double-check pattern to avoid race conditions
                if self._client is None:
                    self._client = DocumentAnalysisClient(
                        endpoint=self.docIntelligenceEndpoint,
                        credential=self.credential
                    )
        return self._client

    async def extract_text_from_sow_document(self, document_data) -> DocumentAnalysisResult:
        """Extract text and structure using Azure AI Document Intelligence."""
        try:
            client = await self._get_client()

            poller = await client.begin_analyze_document(
                model_id="prebuilt-document",
                document=document_data
            )

            result = await poller.result()

            analysis = DocumentAnalysisResult()
            analysis.extracted_text = []
            analysis.text_chunks = []
            
            known_headings = [
                "Project Scope", "Project Objectives", "Location", "Tasks", "Schedules",
                "Standards and Testing", "Payments", "Compliance", "Requirements", "Project Deliverables"
            ]

            for page in result.pages:
                page_text = " ".join([line.content for line in page.lines])
                analysis.extracted_text.append(page_text)

                current_heading = None
                for line in page.lines:
                    text = line.content
                    if self.__is_heading(text, known_headings):  # Detect headings
                        current_heading = text
                        newTextChunk = TextChunk()
                        newTextChunk.heading = text
                        newTextChunk.content = ""
                        newTextChunk.page_number = page.page_number
                        analysis.text_chunks.append(newTextChunk)
                    elif current_heading and analysis.text_chunks:
                        analysis.text_chunks[-1].content += " " + text

            analysis.full_text = "\n".join(analysis.extracted_text)

            return analysis
            
        except AzureError as e:
            print(f"Azure Document Intelligence error in extract_text_from_sow_document: {e}")
            raise
        except Exception as e:
            print(f"Unexpected error in extract_text_from_sow_document: {e}")
            raise

    async def extract_text_from_invoice_document(self, document_data) -> InvoiceDocumentAnalysisResult:
        """Extract text and structure using Azure AI Document Intelligence."""
        try:
            client = await self._get_client()

            poller = await client.begin_analyze_document(
                model_id="prebuilt-invoice",
                document=document_data
            )

            result = await poller.result()

            analysis = InvoiceDocumentAnalysisResult()
            analysis.extracted_text = []
            analysis.text_chunks = []
            analysis.line_items = []
            
            for page in result.pages:
                page_text = " ".join([line.content for line in page.lines])
                analysis.extracted_text.append(page_text)

            invoiceDocument = result.documents[0] # Assuming a single invoice document
            items_field = invoiceDocument.fields.get("Items")
            if items_field and items_field.value:
                for item in items_field.value:
                    line_item = InvoiceLineItem()

                    description_field = item.value.get("Description")
                    amount_field = item.value.get("Amount")
                    due_date_field = item.value.get("Date")

                    # Extract and clean up fields
                    line_item.description = description_field.content if description_field else "N/A"
                    line_item.amount = amount_field.content if amount_field else "0"
                    
                    # Remove currency symbols or extra characters from amount
                    line_item.amount = float(re.sub(r"[^\d.]", "", line_item.amount))

                    # Extract due date
                    text_due_date = due_date_field.content if due_date_field else "1970-01-01"
                    line_item.due_date = datetime.strptime(text_due_date, '%Y-%m-%d').date() if text_due_date else None

                    # Determine the status based on the due date
                    line_item.status = 'Completed' if line_item.due_date and line_item.due_date < date(2024, 12, 31) else 'Pending'  # Changed line

                    analysis.line_items.append(line_item)
            analysis.full_text = "\n".join(analysis.extracted_text)
            return analysis
        except AzureError as e:
            print(f"Azure Document Intelligence error in extract_text_from_invoice_document: {e}")
            raise
        except Exception as e:
            print(f"Unexpected error in extract_text_from_invoice_document: {e}")
            raise

    def __is_heading(self, text: str, known_headings: List[str]) -> bool:
        """Check if the text matches any known headings."""
        return text.strip() in known_headings

    def semantic_chunking(self, text: str, genai_provider: FrameworkProviderBase) -> List[str]:
        """Chunk text into semantically meaningful pieces using GenAI facade."""
        return genai_provider.split_text(text, max_chunk_size=500, overlap=50)

    async def format_text_to_json(self, genai_provider: FrameworkProviderBase, full_text: str, system_prompt: str) -> dict:
        """Use LLM to format data into JSON structure"""
        try:
            response = await genai_provider.chat(user_message=full_text, system_prompt=system_prompt)
            json_response = json.loads(response)
            return json_response
        except json.JSONDecodeError as e:
            print(f"Failed to parse LLM response as JSON: {e}")
            raise
        except Exception as e:
            print(f"Error in format_text_to_json: {e}")
            raise
