from datetime import datetime, timezone
from app.lifespan_manager import get_chat_client, get_db_connection_pool, get_prompt_service, get_chat_client
from app.models import Deliverable, InvoiceLineItem, InvoiceValidationResult, ListResponse, SowValidationResult, Vendor
from fastapi import APIRouter, Depends, HTTPException
from app.models.validation import InvoiceModel, SowModel, MilestoneModel
from semantic_kernel.contents.chat_message_content import ChatMessageContent
from semantic_kernel.functions import kernel_function
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.agents import ChatCompletionAgent

from pydantic import parse_obj_as

# Initialize the router
router = APIRouter(
    prefix = "/validation",
    tags = ["Validation"],
    dependencies = [Depends(get_chat_client)],
    responses = {404: {"description": "Not found"}}
)

@router.get("/invoice/{id}", response_model=ListResponse[InvoiceValidationResult])
async def list_invoice_validations(id: int, pool = Depends(get_db_connection_pool)):
    """Retrieves a list of validation results for an Invoice from the database."""
    async with pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM invoice_validation_results WHERE invoice_id = $1 ORDER BY datestamp DESC;', id)
        validations = parse_obj_as(list[InvoiceValidationResult], [dict(row) for row in rows])
    return ListResponse(data=validations, total = len(validations), skip = 0, limit = len(validations))

@router.post('/invoice/{id}', response_model = str)
#async def validate_invoice_by_id(request: ValidationRequest, id: int, llm = Depends(get_chat_client)):
async def validate_invoice_by_id(id: int, prompt_service = Depends(get_prompt_service)):
    """Generate a chat completion to Validate the Invoice using the Azure OpenAI API."""
    
    # Define the system prompt for the validator.
    system_prompt = prompt_service.get_prompt("invoice_validation")
    # Append the current date to the system prompt to provide context when checking timeliness of deliverables.
    system_prompt += f"\n\nFor context, today is {datetime.now(timezone.utc).strftime('%A, %B %d, %Y')}."

    # Create a history of the conversation
    messages = []

    # Provide the validation copilot with a persona using the system prompt.
    messages.append(ChatMessageContent(role="system", content=system_prompt))

    # Add the current user message to the messages list
    userMessage = f"""validate Invoice with ID of {id}. Use the validate_invoice function to retrieve the invoice and it's associated line items, SOW, and milestones."""
    messages.append(ChatMessageContent(role="user", content=userMessage))
    
    # Instantiate function tools' class
    tools = InvoiceWithSow()

    # Create an agent
    agent = ChatCompletionAgent(
        service=await get_chat_client(),
        instructions=system_prompt,
        plugins=[tools]
    )

    # Get response from agent.
    response = await agent.get_response(messages=messages)

    validationResult = str(response.content)

    # Check if validationResult contains [PASSED] or [FAILED]
    # This is based on the prompt telling the AI to return either [PASSED] or [FAILED]
    # at the end of the response to indicate if the invoice passed or failed validation.
    validation_passed = validationResult.find('[PASSED]') != -1

    # Write validation result to database
    pool = await get_db_connection_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
        INSERT INTO invoice_validation_results (invoice_id, datestamp, result, validation_passed)
        VALUES ($1, $2, $3, $4);
        ''', id, datetime.utcnow(), validationResult, validation_passed)

    return validationResult



@router.get("/sow/{id}", response_model=ListResponse[SowValidationResult])
async def list_sow_validations(id: int, pool = Depends(get_db_connection_pool)):
    """Retrieves a list of validation results for a SOW from the database."""
    async with pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM sow_validation_results WHERE sow_id = $1 ORDER BY datestamp DESC;', id)
        validations = parse_obj_as(list[SowValidationResult], [dict(row) for row in rows])
    return ListResponse(data=validations, total = len(validations), skip = 0, limit = len(validations))



@router.post('/sow/{id}', response_model = str)
async def validate_sow_by_id(id: int, prompt_service = Depends(get_prompt_service)):
    """Generate a chat completion to Validate the SOW using the Azure OpenAI API."""

    # Define the system prompt for the validator.
    system_prompt = prompt_service.get_prompt("sow_validation")
    # Append the current date to the system prompt to provide context when checking timeliness of deliverables.
    system_prompt += f"\n\nFor context, today is {datetime.now(timezone.utc).strftime('%A, %B %d, %Y')}."

    # Create a history of the conversation
    messages = []

    # Provide the validation copilot with a persona using the system prompt.
    messages.append(ChatMessageContent(role="system", content=system_prompt))

    # Add the current user message to the messages list
    userMessage = f"""validate SOW with ID {id}. Use the validate_sow function to retrieve the SOW and it's associated milestones and deliverables."""
    messages.append(ChatMessageContent(role="user", content=userMessage))

    # Instantiate function tools' class
    tools = InvoiceWithSow()

    # Create an agent
    agent = ChatCompletionAgent(
        service=await get_chat_client(),
        instructions=system_prompt,
        plugins=[tools]
    )

    # Get response from agent.
    response = await agent.get_response(messages=messages)
    validationResult = str(response.content)

    # Check if validationResult contains [PASSED] or [FAILED]
    validation_passed = validationResult.find('[PASSED]') != -1

    # Write validation result to database
    pool = await get_db_connection_pool()
    async with pool.acquire() as conn:
        await conn.execute('''
        INSERT INTO sow_validation_results (sow_id, datestamp, result, validation_passed)
        VALUES ($1, $2, $3, $4);
        ''', id, datetime.utcnow(), validationResult, validation_passed)

    return validationResult

# Define function tools to be used by the agent
class InvoiceWithSow:
    @kernel_function(description="Used to retrieve an Invoice and it's associated Line Items, SOW, and Milestones. Call this function by passing the invoice id.")
    async def validate_invoice(self, id: int):
        """Retrieves an Invoice and it's associated Line Items, SOW, and Milestones."""

        pool = await get_db_connection_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM invoices WHERE id = $1;', id)
            if row is None:
                raise HTTPException(status_code=404, detail=f'An invoice with an id of {id} was not found.')
            invoice = parse_obj_as(InvoiceModel, dict(row))

            # Get the vendor name
            vendor_row = await conn.fetchrow('SELECT * FROM vendors WHERE id = $1;', invoice.vendor_id)
            invoice.vendor = parse_obj_as(Vendor, dict(vendor_row))

            # Get the invoice line items
            line_item_rows = await conn.fetch('SELECT * FROM invoice_line_items WHERE invoice_id = $1;', id)
            invoice.line_items = [parse_obj_as(InvoiceLineItem, dict(row)) for row in line_item_rows]

            # Get the SOW
            sow_row = await conn.fetchrow('SELECT * FROM sows WHERE id = $1;', invoice.sow_id)
            sow = parse_obj_as(SowModel, dict(sow_row))

            # Get the milestones
            milestone_rows = await conn.fetch('SELECT * FROM milestones WHERE sow_id = $1;', invoice.sow_id)
            sow.milestones = [parse_obj_as(MilestoneModel, dict(row)) for row in milestone_rows]

            # Get the deliverables for each milestone
            for milestone in sow.milestones:
                deliverable_rows = await conn.fetch('SELECT * FROM deliverables WHERE milestone_id = $1;', milestone.id)
                milestone.deliverables = parse_obj_as(list[Deliverable], [dict(row) for row in deliverable_rows])

        return invoice, sow

    @kernel_function(description="Used to retrieve a SOW and it's associated Milestones and Deliverables. Call this function by passing the SOW id.")
    async def validate_sow(self, id: int):
        """Retrieves a SOW and it's associated Milestones and Deliverables."""

        pool = await get_db_connection_pool()
        async with pool.acquire() as conn:
            row = await conn.fetchrow('SELECT * FROM sows WHERE id = $1;', id)
            if row is None:
                raise HTTPException(status_code=404, detail=f'A SOW with an id of {id} was not found.')
            sow = parse_obj_as(SowModel, dict(row))

            # Get the milestones
            milestone_rows = await conn.fetch('SELECT * FROM milestones WHERE sow_id = $1;', id)
            sow.milestones = [parse_obj_as(MilestoneModel, dict(row)) for row in milestone_rows]

            # Get the deliverables for each milestone
            for milestone in sow.milestones:
                deliverable_rows = await conn.fetch('SELECT * FROM deliverables WHERE milestone_id = $1;', milestone.id)
                milestone.deliverables = parse_obj_as(list[Deliverable], [dict(row) for row in deliverable_rows])

        return sow


