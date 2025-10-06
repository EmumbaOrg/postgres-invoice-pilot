from datetime import datetime, timezone
from langchain.agents import AgentExecutor, create_openai_functions_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from langchain_core.tools import StructuredTool
from app.lifespan_manager import get_chat_client, get_db_connection_pool, get_prompt_service
from app.models import InvoiceValidationResult, ListResponse, SowValidationResult
from fastapi import APIRouter, Depends, HTTPException
from datetime import timedelta
from pydantic import parse_obj_as
import json

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
async def validate_invoice_by_id(id: int, llm = Depends(get_chat_client), prompt_service = Depends(get_prompt_service)):
    """Generate a chat completion to Validate the Invoice using the Azure OpenAI API."""
    
    # Define the system prompt for the validator.
    system_prompt = prompt_service.get_prompt("invoice_validation")
    # Append the current date to the system prompt to provide context when checking timeliness of deliverables.
    system_prompt += f"\n\nFor context, today is {datetime.now(timezone.utc).strftime('%A, %B %d, %Y')}."

    # Provide the validation copilot with a persona using the system prompt.
    messages = [{ "role": "system", "content": system_prompt }]

    # Add the current user message to the messages list
    userMessage = f"""validate Invoice with ID of {id}"""
    messages.append({"role": "user", "content": userMessage})

    # Create a chat prompt template
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("user", "{input}"),
            MessagesPlaceholder("agent_scratchpad")
        ]
    )
    
    # Define tools for the agent
    tools = [
         StructuredTool.from_function(coroutine=validate_invoice)
    ]
    
    # Create an AI agent
    agent = create_openai_functions_agent(llm=llm, tools=tools, prompt=prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, return_intermediate_steps=True)

    # Invoke the agent to perform a chat completion that provides the validation results.
    completion = await agent_executor.ainvoke({"input": userMessage})
    validationResult = completion['output']

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

async def validate_invoice(id: int):
    """Retrieves an Invoice and it's associated Line Items, SOW, and Milestones."""

    pool = await get_db_connection_pool()
    async with pool.acquire() as conn:
        invoice_row = await conn.fetchrow('SELECT * FROM invoices WHERE id = $1;', id)
        if invoice_row is None:
            raise HTTPException(status_code=404, detail=f'An invoice with an id of {id} was not found.')
        invoice = dict(invoice_row)
        invoice_metadata_dict = json.loads(invoice.get("metadata"))
        invoice_metadata_dict_updated = await update_metadata_invoice(invoice, invoice_metadata_dict, conn)

        # Get the vendor name
        vendor_row = await conn.fetchrow('SELECT * FROM vendors WHERE id = $1;', invoice.get("vendor_id"))
        vendor = dict(vendor_row)

        # Get the SOW
        sow_row = await conn.fetchrow('SELECT * FROM sows WHERE id = $1;', invoice.get("sow_id"))
        sow = dict(sow_row)
        sow_metadata_dict = json.loads(sow.get("metadata"))
        sow_metadata_dict_updated = await(update_metadata_sow(sow, sow_metadata_dict, conn))

        # convert date to text format as it is easier for LLM to understand
        invoice_metadata = await format_invoice_dates(invoice_metadata_dict_updated)
        sow_metadata = await format_sow_dates(sow_metadata_dict_updated)

        combined_information = f"""Vendor Information: {json.dumps(vendor)}\n\nSOW Information: {json.dumps(sow_metadata)}\n\nInvoice Information: {json.dumps(invoice_metadata)}\n\n"""

    return combined_information


@router.get("/sow/{id}", response_model=ListResponse[SowValidationResult])
async def list_sow_validations(id: int, pool = Depends(get_db_connection_pool)):
    """Retrieves a list of validation results for a SOW from the database."""
    async with pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM sow_validation_results WHERE sow_id = $1 ORDER BY datestamp DESC;', id)
        validations = parse_obj_as(list[SowValidationResult], [dict(row) for row in rows])
    return ListResponse(data=validations, total = len(validations), skip = 0, limit = len(validations))

@router.post('/sow/{id}', response_model = str)
async def validate_sow_by_id(id: int, llm = Depends(get_chat_client), prompt_service = Depends(get_prompt_service)):
    """Generate a chat completion to Validate the SOW using the Azure OpenAI API."""

    # Define the system prompt for the validator.
    system_prompt = prompt_service.get_prompt("sow_validation")
    # Append the current date to the system prompt to provide context when checking timeliness of deliverables.
    system_prompt += f"\n\nFor context, today is {datetime.now(timezone.utc).strftime('%A, %B %d, %Y')}."

    # Provide the validation copilot with a persona using the system prompt.
    messages = [{ "role": "system", "content": system_prompt }]

    # Add the current user message to the messages list
    userMessage = f"""validate SOW with ID {id}"""
    messages.append({"role": "user", "content": userMessage})

    # Create a chat prompt template
    prompt = ChatPromptTemplate.from_messages(
        [
            ("system", system_prompt),
            ("user", "{input}"),
            MessagesPlaceholder("agent_scratchpad")
        ]
    )

    tools = [
         StructuredTool.from_function(coroutine=validate_sow)
    ]
    
    # Create an agent
    agent = create_openai_functions_agent(llm=llm, tools=tools, prompt=prompt)
    agent_executor = AgentExecutor(agent=agent, tools=tools, verbose=True, return_intermediate_steps=True)
    #completion = await agent_executor.ainvoke({"input": request.message})
    completion = await agent_executor.ainvoke({"input": userMessage})

    validationResult = completion['output']

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

async def validate_sow(id: int):
    """Retrieves a SOW and it's associated Milestones and Deliverables."""

    pool = await get_db_connection_pool()
    async with pool.acquire() as conn:
        sow_row = await conn.fetchrow('SELECT * FROM sows WHERE id = $1;', id)
        if sow_row is None:
            raise HTTPException(status_code=404, detail=f'A SOW with an id of {id} was not found.')

        sow_dict = dict(sow_row)

        sow_metadata_dict = json.loads(sow_dict.get("metadata"))

        # Add more information regarding the SOW, its Milestones and Deliverables to the metadata
        sow_metadata_dict_updated = await(update_metadata_sow(sow_dict, sow_metadata_dict, conn))

        # convert dates to text format as it becomes easier for LLM to understand
        sow_dict = await format_sow_dates(sow_metadata_dict_updated)            

        # get vendor information
        vendor_row = await conn.fetchrow('SELECT name,contact_name,contact_email FROM vendors WHERE id = $1;', sow_row.get("vendor_id"))
        vendor = dict(vendor_row)
        
    return f"sow information: {json.dumps(sow_dict)}\n\nvendor information: {json.dumps(vendor)}"

async def format_sow_dates(metadata):
    """Formats sow metadata dates to a textual format."""
    
    try:

        if isinstance(metadata, str):
            metadata = json.loads(metadata)

        metadata['Effective_Date'] = to_textual_date(metadata.get('Effective_Date'))
        metadata['Project_Completion_Date'] = to_textual_date(metadata.get('Project_Completion_Date'))

        # Format Schedules dates
        if "Schedules" in metadata:
            for schedule in metadata["Schedules"]:
                schedule["Milestone_Completion_Due_Date"] = to_textual_date(schedule.get("Milestone_Completion_Due_Date"))

        # Format Project_Deliverables dates
        if "Project_Deliverables" in metadata:
            for deliverable in metadata["Project_Deliverables"]:
                date_str = deliverable.get("Milestone_Payment_Due_Date")
                deliverable["Milestone_Payment_Due_Date"] = to_textual_date(date_str)

        return metadata

    except Exception as e:
        print(f"Error formatting sow dates: {e}. Try again")

        return metadata

async def format_invoice_dates(metadata):
    """Formats invoice metadata dates to a textual format."""
    
    try:

        if isinstance(metadata, str):
            metadata = json.loads(metadata)
        
        metadata['Invoice_Date'] = to_textual_date(metadata.get('Invoice_Date'))

        if "Project_Deliverables" in metadata:
            for deliverable in metadata["Project_Deliverables"]:
                date_str = deliverable.get("Milestone_Payment_Due_Date")
                deliverable["Milestone_Payment_Due_Date"] = to_textual_date(date_str)

        return metadata

    except Exception as e:
        print(f"Error formatting invoice dates: {e}. Try again")

        return metadata        

def to_textual_date(date_str):
    """Convert a date string (ISO or textual) to textual format 'D Month YYYY'."""
    from datetime import datetime

    if not date_str:
        return None

    # ISO format
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return dt.strftime("%d %B %Y")
    except ValueError:
        pass

    # textual format
    try:
        dt = datetime.strptime(date_str, "%d %B %Y")
        return dt.strftime("%d %B %Y")
    except ValueError:
        pass

    # If parsing fails, return original string
    return date_str

async def update_metadata_sow(sow_dict, metadata_dict, conn):
    
    """Add information from the SOW, Milestones and Deliverables to the metadata."""

    # add information from SOW table
    metadata_dict['SOW_Number'] = str(sow_dict.get('number'))
    metadata_dict['Total_Amount'] = str(sow_dict.get('budget'))
    metadata_dict['Effective_Date'] = sow_dict.get('start_date').isoformat()
    metadata_dict['Project_Completion_Date'] = sow_dict.get('end_date').isoformat()

    # add information from milestones and deliverables table
    milestones_rows = await conn.fetch('SELECT * FROM milestones WHERE sow_id = $1;', sow_dict.get("id"))
    milestones = [dict(row) for row in milestones_rows]
    
    Project_Deliverables = []

    for milestone in milestones:
        deliverables_rows = await conn.fetch('SELECT * FROM deliverables WHERE milestone_id = $1;', milestone.get("id"))
        deliverables = [dict(row) for row in deliverables_rows]
        
        for deliverable in deliverables:
            Project_Deliverables.append({
                "Milestone_Name": milestone.get("name"),
                "Deliverable": deliverable.get("description"),
                "Amount": str(deliverable.get("amount")),
                "Milestone_Payment_Due_Date": (deliverable.get("due_date") + timedelta(days=30)).isoformat()
            })

    metadata_dict['Project_Deliverables'] = Project_Deliverables

    return metadata_dict  


async def update_metadata_invoice(invoice_dict, metadata_dict, conn):
    
    """Add information from Invoice and its Line Items to the metadata."""
    
    metadata_dict['Invoice_Number'] = str(invoice_dict.get('number'))
    metadata_dict['SOW_Number'] = str(await conn.fetchval('SELECT number FROM sows WHERE id = $1;', invoice_dict.get("sow_id")))
    metadata_dict['Total_Amount'] = str(invoice_dict.get('amount'))
    metadata_dict['Invoice_Date'] = invoice_dict.get('invoice_date').isoformat()

    line_items_rows = await conn.fetch('SELECT * FROM invoice_line_items WHERE invoice_id = $1;', invoice_dict.get("id"))
    line_items = [dict(row) for row in line_items_rows]
    
    Project_Deliverables = []

    for line_item in line_items:

        # append to Project_Deliverables
        Project_Deliverables.append({
            "Milestone_Name": await conn.fetchval('SELECT milestone_of_line_item FROM invoice_line_items WHERE id = $1;', line_item.get("id")),
            "Deliverable": line_item.get("description"),
            "Amount": str(line_item.get("amount")),
            "Milestone_Payment_Due_Date": line_item.get("due_date").isoformat()
        })

    metadata_dict['Project_Deliverables'] = Project_Deliverables

    return metadata_dict