from dotenv import load_dotenv
load_dotenv()
import os
from app.functions.chat_functions import ChatFunctions
from app.lifespan_manager import get_chat_client, get_db_connection_pool, get_embedding_client, get_prompt_service
from app.models import CompletionRequest, CompletionResponse
from fastapi import APIRouter, Depends
from semantic_kernel.connectors.ai.open_ai import AzureChatCompletion
from semantic_kernel.agents import ChatCompletionAgent
from semantic_kernel.contents.chat_message_content import ChatMessageContent

api_key = os.getenv("API_KEY_AZURE_OPENAI")
endpoint = os.getenv("AZURE_OPENAI_ENDPOINT")
deployment_name = os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME")

# Initialize the router
router = APIRouter(
    prefix = "/completions",
    tags = ["Completions"],
    dependencies = [Depends(get_chat_client)],
    responses = {404: {"description": "Not found"}}
)

@router.post('/chat', response_model=CompletionResponse)
async def generate_chat_completion(
    request: CompletionRequest,
    db_pool = Depends(get_db_connection_pool),
    embedding_client = Depends(get_embedding_client),
    prompt_service = Depends(get_prompt_service)):
    """Generate a chat completion using the Azure OpenAI API."""
        
    # Retrieve the copilot prompt
    system_prompt = prompt_service.get_prompt("copilot")

    # Get the chat session ID
    session_id = request.session_id

    # Create a chat session if one does not exist
    if (session_id == None or session_id <= 0):
        # if session_id is not provided or -1, create a new chat session
        # use the user prompt as the name of the session
        async with db_pool.acquire() as conn:
            session_id = await create_chat_session(conn, request.message)

    # Create a history of the conversation
    messages = []

    # Add the chat history to the messages list for the session
    # Chat history provides context of previous questions and responses for the copilot.
    async with db_pool.acquire() as conn:
        chat_history_from_db = await get_chat_history(conn, session_id)
        
        for message in chat_history_from_db[-request.max_history:]:
            if message["role"] == "system":
                messages.append(ChatMessageContent(role="system", content=message["content"]))
            elif message["role"] == "user":
                messages.append(ChatMessageContent(role="user", content=message["content"]))
            elif message["role"] == "assistant":
                messages.append(ChatMessageContent(role="assistant", content=message["content"]))
   
    # add current user message to history
    messages.append(ChatMessageContent(role="user", content=request.message))

    # Get the chat functions
    cf = ChatFunctions(db_pool, embedding_client)
    
    # Create an agent
    agent = ChatCompletionAgent(
        service=AzureChatCompletion(deployment_name=deployment_name,
        api_key=api_key,
        endpoint=endpoint),
        instructions=f"{system_prompt}",
        plugins=[cf],
    )

    # response = str((await agent.get_response(f"{history}")).content)
    response = str((await agent.get_response(messages=messages)).content)

    # Write the chat history to the database
    async with db_pool.acquire() as conn:
        await write_chat_history(conn, session_id, "user", request.message)
        await write_chat_history(conn, session_id, "assistant", response)

    # Return the completion output
    return CompletionResponse(
        session_id = int(request.session_id),
        content = response
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