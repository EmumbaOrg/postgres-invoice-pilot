from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Response, Query
from typing import Literal
from app.lifespan_manager import get_storage_service, get_config_service, get_activity_log_service
from azure.core.exceptions import ResourceNotFoundError
import asyncpg
from app.lifespan_manager import get_db_connection_pool

import os

router = APIRouter(
    prefix = "/documents",
    tags = ["Documents"],
    dependencies = [Depends(get_storage_service)],
)

@router.get("/", response_model = list[dict])
async def get(sort_by: Literal["blob_name", "created"] = Query(default="blob_name", description="Field to sort by"),storage_service = Depends(get_storage_service), app_config = Depends(get_config_service)):
    """
        Retrieves a list of all documents in the specified blob container.
        Blobs are returned sorted by the specified field (blob_name by default).
    """
    try:
        container_client = await storage_service.get_container_client(app_config.get_document_container_name())
        blobs = []
        async for blob in container_client.list_blobs():
            blob_properties = await container_client.get_blob_client(blob).get_blob_properties()
            blobs.append({
                "blob_name": blob.name,
                "content_type": blob_properties.content_settings.content_type,
                "created": blob_properties.creation_time.strftime('%B %d, %Y at %I:%M %p'),
                "size": blob_properties.size
            })
        # Sort documents by the specified field
        if sort_by == "blob_name":
            blobs.sort(key=lambda x: (x["blob_name"], x["created"]))
        elif sort_by == "created":
            blobs.sort(key=lambda x: x["created"], reverse=True)
   
        return blobs
   
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.reason)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=500, detail=str(e))
    
@router.get("/{blob_name:path}")
async def get_document(blob_name: str, storage_service = Depends(get_storage_service), app_config = Depends(get_config_service)):
    """
    Reads the specified document from the container.
    """
    try:
        blob_client = await storage_service.get_blob_client(container=app_config.get_document_container_name(), blob=blob_name)
        blob_properties = await blob_client.get_blob_properties()
        download_stream = await blob_client.download_blob()
        content = await download_stream.readall()
        headers = {
            "Content-Type": blob_properties.content_settings.content_type,
            "Content-Disposition": f'attachment; filename="{os.path.basename(blob_client.blob_name)}"'
        }
        return Response(content=content, headers=headers)
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.reason)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/")
async def upload_document(file: UploadFile = File(...), storage_service = Depends(get_storage_service), app_config = Depends(get_config_service), pool: asyncpg.Pool = Depends(get_db_connection_pool), activity_service = Depends(get_activity_log_service)):
    """
    Upload a document to the specified container.
    """
    try:
        container_client = storage_service.get_container_client(app_config.get_document_container_name())

        # Check if the container exists, if not create it
        if not await container_client.exists():
            await container_client.create_container()

        blob_client = container_client.get_blob_client(blob=file.filename)
        await blob_client.upload_blob(file.file, overwrite=True)
        
        # Log the activity
        await activity_service.log_activity(
            action="uploaded",
            resource_type="document",
            resource_name=file.filename,
            pool=pool
        )
        
        return {"message": f"Document {file.filename} uploaded successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.delete("/{blob_name:path}")
async def delete_document(blob_name: str, storage_service = Depends(get_storage_service), app_config = Depends(get_config_service), pool: asyncpg.Pool = Depends(get_db_connection_pool), activity_service = Depends(get_activity_log_service)):
    """
    Delete a document from the container.
    """
    try:
        blob_client = await storage_service.get_blob_client(container=app_config.get_document_container_name(), blob=blob_name)
        await blob_client.delete_blob()

        # Log the activity
        await activity_service.log_activity(
            action="deleted",
            resource_type="document",
            resource_name=blob_name,
            pool=pool
        )

        return {"message": f"Document {blob_name} deleted successfully."}
    except ResourceNotFoundError as e:
        raise HTTPException(status_code=404, detail=e.reason)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))