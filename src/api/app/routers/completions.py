from app.framework_providers.interface import FrameworkProviderBase
from app.functions.chat_functions import ChatFunctions
from app.lifespan_manager import get_genai_provider, get_config_service, get_db_connection_pool, get_prompt_service
from app.models import CompletionRequest, CompletionResponse
from fastapi import APIRouter, Depends


router = APIRouter(
    prefix = "/completions",
    tags = ["Completions"],
    responses = {404: {"description": "Not found"}}
)

@router.post('/chat', response_model=CompletionResponse)
async def generate_chat_completion(
    request: CompletionRequest,
    db_pool = Depends(get_db_connection_pool),
    genai_provider: FrameworkProviderBase = Depends(get_genai_provider),
    prompt_service = Depends(get_prompt_service),
    app_config = Depends(get_config_service),
):
    """Generate a chat completion using the Azure OpenAI API."""

    messages = []
    session_id = request.session_id
    system_prompt = prompt_service.get_prompt("copilot")

    if (session_id == None or session_id <= 0):
        # if session_id is not provided or -1, create a new chat session
        # use the user prompt as the name of the session
        async with db_pool.acquire() as conn:
            session_id = await create_chat_session(conn, request.message)

    # Add the chat history to the messages list for the session
    async with db_pool.acquire() as conn:
        chat_history = await get_chat_history(conn, session_id)
        for message in chat_history[-request.max_history:]:
            messages.append({"role": message["role"], "content": message["content"]})

    cf = ChatFunctions(db_pool, genai_provider, app_config.get_chat_model_deployment())
    tools = [
        cf.find_invoice_line_items,
        cf.find_invoice_validation_results,
        cf.find_milestone_deliverables,
        cf.find_sow_chunks_with_semantic_ranking,
        cf.find_sow_validation_results,
        cf.get_invoice_id,
        cf.get_invoice_line_items,
        cf.get_invoice_validation_results,
        cf.get_invoices,
        cf.get_unpaid_invoices_for_vendor,
        cf.get_sow_chunks,
        cf.get_sow_id,
        cf.get_sow_milestones,
        cf.get_milestone_deliverables,
        cf.get_sow_validation_results,
        cf.get_sows,
        cf.get_vendors,
    ]
    genai_provider = await genai_provider.build_agent(system_prompt=system_prompt, tools=tools)
    completion = await genai_provider.run(user_message=request.message, messages=messages)

    async with db_pool.acquire() as conn:
        await write_chat_history(conn, session_id, "user", request.message)
        await write_chat_history(conn, session_id, "assistant", str(completion))

    return CompletionResponse(
        session_id = int(session_id),
        content = str(completion)
    )

@router.get('/sessions')
async def get_chat_sessions(
    db_pool = Depends(get_db_connection_pool)
    ):
    """Retrieves a list of chat sessions."""
    sessions = []
    async with db_pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM copilot_chat_sessions ORDER BY datestamp DESC;')
        for row in rows:
            sessions.append({"id": row["id"], "name": row["name"]})
    return sessions

@router.get('/history/{session_id}')
async def get_chat_history(
    session_id: int,
    db_pool = Depends(get_db_connection_pool)
    ):
    """Retrieves the chat history for a chat session."""
    messages = []
    async with db_pool.acquire() as conn:
        chat_history = await get_chat_history(conn, session_id)
        for message in chat_history:
            messages.append({"role": message["role"], "content": message["content"]})
    return messages

@router.delete('/sessions/{session_id}')
async def delete_chat_session(
    session_id: int,
    db_pool = Depends(get_db_connection_pool)
    ):
    """Deletes a chat session."""
    async with db_pool.acquire() as conn:
        await conn.execute('DELETE FROM copilot_chat_session_history WHERE copilot_chat_session_id = $1;', session_id)
        await conn.execute('DELETE FROM copilot_chat_sessions WHERE id = $1;', session_id)
    return {"status": "success"}

async def get_chat_history(conn, session_id: int):
    rows = await conn.fetch(
        """
        SELECT role, content
        FROM copilot_chat_session_history
        WHERE copilot_chat_session_id = $1
        ORDER BY datestamp
        """,
        session_id
    )
    return rows

async def create_chat_session(conn, name: str):
    session_id = await conn.fetchval(
        """
        INSERT INTO copilot_chat_sessions
        (name)
        VALUES (
            $1
        )
        RETURNING id;
        """, name)
    return session_id

async def write_chat_history(conn, session_id: int, role: str, content: str):
    await conn.execute(
        """
        INSERT INTO copilot_chat_session_history (copilot_chat_session_id, role, content)
        VALUES ($1, $2, $3)
        """,
        session_id, role, content
    )