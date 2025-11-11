from app.lifespan_manager import (
    get_db_connection_pool,
    get_storage_service,
    get_azure_doc_intelligence_service,
    get_activity_log_service,
    get_genai_provider,
    get_prompt_service,
    get_age_graph_service
)
from app.models import Sow, SowEdit, SowChunk, ListResponse, SowAnalyzeResult, SowGraphData
from fastapi import APIRouter, Depends, HTTPException, File, UploadFile, Form
from datetime import datetime, timedelta
from pydantic import parse_obj_as
import json
import traceback

# Initialize the router
router = APIRouter(
    prefix = "/sows",
    tags = ["SOWs"],
    dependencies = [Depends(get_db_connection_pool)],
    responses = {404: {"description": "Not found"}}
)


@router.get("/", response_model=ListResponse[Sow])
async def list_sows(vendor_id: int = -1, skip: int = 0, limit: int = 10, sortby: str = None, pool = Depends(get_db_connection_pool)):
    """Retrieves a list of SOWs from the database."""
    orderby = 'id'
    if (sortby):
        orderby = sortby
    async with pool.acquire() as conn:
       
        if (limit < 0):
            if(vendor_id > 0):
                rows = await conn.fetch('SELECT * FROM sows WHERE vendor_id = $1 ORDER BY $2;', vendor_id, orderby)
            else:
                rows = await conn.fetch('SELECT * FROM sows ORDER BY $1;', orderby)
        else:
            if(vendor_id > 0):
                rows = await conn.fetch('SELECT * FROM sows WHERE vendor_id = $1 ORDER BY $2 LIMIT $3 OFFSET $4;', vendor_id, orderby, limit, skip)
            else:
                rows = await conn.fetch('SELECT * FROM sows ORDER BY $1 LIMIT $2 OFFSET $3;', orderby, limit, skip)

        sows = parse_obj_as(list[Sow], [dict(row) for row in rows])

        if (vendor_id > 0):
            total = await conn.fetchval('SELECT COUNT(*) FROM sows WHERE vendor_id = $1;', vendor_id)
        else:
            total = await conn.fetchval('SELECT COUNT(*) FROM sows;')

    if (limit < 0):
        limit = total

    return ListResponse[Sow](data=sows, total = total, skip = skip, limit = limit)


@router.get("/{sow_id}", response_model=Sow)
async def get_by_id(sow_id: int, pool = Depends(get_db_connection_pool)):
    """Retrieves a SOW by ID from the database."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow('SELECT * FROM sows WHERE id = $1;', sow_id)
        if row is None:
            raise HTTPException(status_code=404, detail=f'A SOW with an id of {sow_id} was not found.')
        
        sow_dict = dict(row)
        # remove unnecessary trailing and leading characters if present
        if sow_dict.get('summary').startswith('{"') and sow_dict.get('summary').endswith('"}'):
            sow_dict['summary'] = sow_dict.get('summary', '')[2:-2]
        
        sow = parse_obj_as(Sow, sow_dict)
 
    return sow


@router.post("/", response_model=SowAnalyzeResult)
async def analyze_sow(
    file: UploadFile = File(...),
    vendor_id: int = Form(...),
    pool = Depends(get_db_connection_pool),
    storage_service = Depends(get_storage_service),
    doc_intelligence_service = Depends(get_azure_doc_intelligence_service),
    genai_provider = Depends(get_genai_provider),
    prompt_service = Depends(get_prompt_service),
    activity_service = Depends(get_activity_log_service),
    age_graph_service = Depends(get_age_graph_service)
):
    """Analyze a SOW document and create a new SOW in the database."""
    try:

        # Get vendor_id from vendor_id
        async with pool.acquire() as conn:
            vendor_id = await conn.fetchval('SELECT id FROM vendors WHERE id = $1;', vendor_id)
            if vendor_id is None:
                raise HTTPException(status_code=404, detail=f'A vendor with an id of {vendor_id} was not found.')

        # Upload file to Azure Blob Storage
        documentName = await storage_service.save_sow_document(vendor_id, file)

        # Set field defaults
        sow_number = f"SOW-{datetime.now().strftime('%Y-%m%d')}"
        start_date = datetime.strptime("2024-01-01", '%Y-%m-%d').date()
        end_date = datetime.strptime("2024-12-31", '%Y-%m-%d').date()
        budget = 0
        metadata = {}

        # Analyze the document
        document_data = await storage_service.download_blob(documentName)

        analysis_result = await doc_intelligence_service.extract_text_from_sow_document(document_data)
        full_text = analysis_result.full_text

        # format text into json object
        response = await doc_intelligence_service.format_text_to_json(genai_provider, full_text, prompt_service.get_prompt("format_sow_text_to_json"))

        # check if uploaded document is a SOW or not
        if response.get("sow_check")=="failed":            
            await storage_service.delete_document(documentName)
            return SowAnalyzeResult(
                hasError=True,
                sow=None,
                message="The document does not appear to be a SOW. Please upload a SOW and try again."
            )
        else:
            metadata = response

        # extract required fields from metadata json and then remove them from metadata
        sow_number = str(metadata['SOW_Number'] or sow_number)
        start_date = datetime.strptime(metadata['Effective_Date'], '%Y-%m-%d').date() if metadata.get('Effective_Date')!="" else start_date
        end_date = datetime.strptime(metadata['Project_Completion_Date'], '%Y-%m-%d').date() if metadata.get('Project_Completion_Date')!="" else end_date
        budget = round(float(metadata['Total_Amount']),2) if metadata.get('Total_Amount')!="" else budget
        project_deliverables = metadata.get('Project_Deliverables', [])

        # Remove extracted fields from metadata
        for field in ['SOW_Number', 'Effective_Date', 'Project_Completion_Date', 'Total_Amount', 'Project_Deliverables']:
            metadata.pop(field, None)

        # Get SOW ID from metadata
        sow_id = None # metadata['sow_id']
        if sow_number is not None:
            async with pool.acquire() as conn:
                sow_id = await conn.fetchval('SELECT id FROM sows WHERE vendor_id = $1 AND number = $2;', vendor_id, sow_number)
               
        # Create SOW in the database and age graph
        async with pool.acquire() as conn:
            if sow_id is None:
                # Create new SOW
                sow_row = await conn.fetchrow('''
                    INSERT INTO sows (number, start_date, end_date, budget, document, metadata, summary, vendor_id)
                    VALUES (
                    $1, $2, $3, $4, $5, $6, 
                    azure_cognitive.summarize_abstractive($7, 'en', 2), --azure_cognitive.summarize_extractive($7, 'en', 2),
                    $8)
                    RETURNING *;
                ''', sow_number, start_date, end_date, budget, documentName, json.dumps(metadata), full_text, vendor_id)
                sow_id = sow_row['id']

                print("\nCreating SOW in AGE graph...\n")
                # Add SOW vertex to the Age graph
                await age_graph_service.add_sow(
                    conn=conn,
                    sow_data = SowGraphData(
                        id=sow_id,
                        number=sow_number,
                        vendor_id=vendor_id,
                        start_date=start_date,
                        end_date=end_date,
                        budget=budget
                        )                        
                )

            else:
                # Update existing SOW with new document
                sow_row = await conn.fetchrow('''
                    UPDATE sows
                    SET start_date = $1,
                        end_date = $2,
                        budget = $3,
                        document = $4,
                        metadata = $5,
                        summary = azure_cognitive.summarize_abstractive($6, 'en', 2) --azure_cognitive.summarize_extractive($6, 'en', 2)
                    WHERE id = $7
                    RETURNING *;
                ''', start_date, end_date, budget, documentName, json.dumps(metadata), full_text, sow_id)

            # Insert milestones and deliverables into the database
            try:
                milestone_ids = {}
                for d in project_deliverables:
                    milestone_name = d['Milestone_Name']
                    # Check if milestone exists
                    milestone_row = await conn.fetchrow(
                        'SELECT id FROM milestones WHERE sow_id = $1 AND name = $2;',
                        sow_id, milestone_name
                    )
                    if milestone_row:
                        milestone_id = milestone_row['id']
                        # Update milestone status if needed
                        await conn.execute(
                            'UPDATE milestones SET status = $1 WHERE id = $2;',
                            'pending', milestone_id
                        )
                    else:
                        # Insert new milestone
                        milestone_row = await conn.fetchrow(
                            '''
                            INSERT INTO milestones (sow_id, name, status)
                            VALUES ($1, $2, $3)
                            RETURNING id;
                            ''',
                            sow_id, milestone_name, 'pending'
                        )
                        milestone_id = milestone_row['id']
                    milestone_ids[milestone_name] = milestone_id

                    # Check if deliverable exists
                    description = d.get('Deliverable', '')
                    deliverable_row = await conn.fetchrow(
                        'SELECT id FROM deliverables WHERE milestone_id = $1 AND description = $2;',
                        milestone_id, description
                    )
                    amount = float(d.get('Amount', 0))
                    due_date = datetime.strptime(d.get('Milestone_Payment_Due_Date',None), '%Y-%m-%d').date() - timedelta(days=30)
                    status = 'pending'
                    if deliverable_row:
                        # Update deliverable
                        await conn.execute(
                            'UPDATE deliverables SET amount = $1, status = $2, due_date = $3 WHERE id = $4;',
                            amount, status, due_date, deliverable_row['id']
                        )
                    else:
                        # Insert new deliverable
                        await conn.execute(
                            '''
                            INSERT INTO deliverables (milestone_id, description, amount, status, due_date)
                            VALUES ($1, $2, $3, $4, $5);
                            ''',
                            milestone_id, description, amount, status, due_date
                        )

            except Exception as e:
                print(f"Error inserting milestones and deliverables In database: {e}")

            if sow_row is None:
                raise HTTPException(status_code=500, detail=f'An error occurred while creating the SOW.')


            sow = parse_obj_as(Sow, dict(sow_row))

            # Save the text chunks for the SOW
            await conn.execute('''DELETE FROM sow_chunks WHERE sow_id = $1''', sow.id)
            for chunk in analysis_result.text_chunks:
                await conn.execute('''
                    INSERT INTO sow_chunks (sow_id, heading, content, page_number) VALUES ($1, $2, $3, $4);
                ''', sow.id, chunk.heading, chunk.content, chunk.page_number)

        # Log the activity
        await activity_service.log_activity(
            action="created",
            resource_type="sow",
            resource_name=str(sow.number),
            pool=pool
        )

        return SowAnalyzeResult(hasError=False, error=None, message="SOW analyzed successfully.", sow=sow)

    except Exception as e:
        print(e) # output error to console
        # return stack trace
        return SowAnalyzeResult(hasError=True, error=traceback.format_exc(), message=str(e), sow=None)


@router.put("/{sow_id}", response_model=Sow)
async def update_sow(sow_id: int, sow_update: SowEdit, pool = Depends(get_db_connection_pool), activity_service = Depends(get_activity_log_service)):
    """Updates a SOW in the database."""
    async with pool.acquire() as conn:
        sow = await get_by_id(sow_id, pool)
        if sow is None:
            raise HTTPException(status_code=404, detail=f'A SOW with an id of {sow_id} was not found.')

        sow.number = sow_update.number
        sow.start_date = sow_update.start_date
        sow.end_date = sow_update.end_date
        sow.budget = sow_update.budget
        sow.vendor_id = sow_update.vendor_id

        # for key, value in sow_update.dict().items():
        #     setattr(sow, key, value)
        row = await conn.fetchrow('''
            UPDATE sows
            SET number = $1, start_date = $2, end_date = $3, budget = $4, vendor_id = $5
            WHERE id = $6
            RETURNING *;''',
            sow.number, sow.start_date, sow.end_date, sow.budget, sow.vendor_id, sow_id)
        if row is None:
            raise HTTPException(status_code=404, detail=f'A SOW with an id of {sow_id} was not found.')
        updated_sow = parse_obj_as(Sow, dict(row))
    
    # Log the activity
    await activity_service.log_activity(
        action="updated",
        resource_type="sow",
        resource_name=str(updated_sow.number),
        pool=pool
    )
    
    return updated_sow

@router.delete("/{id}", response_model=Sow)
async def delete_sow(id: int, pool = Depends(get_db_connection_pool), storage_service = Depends(get_storage_service), activity_service = Depends(get_activity_log_service)):
    """Deletes a SOW from the database."""   
    async with pool.acquire() as conn:
        row = await conn.fetchrow('SELECT * FROM sows WHERE id = $1;', id)
        if row is None:
            raise HTTPException(status_code=404, detail=f'A sow with an id of {id} was not found.')
        sow = parse_obj_as(Sow, dict(row))

        # Delete the document from Azure Blob Storage
        await storage_service.delete_document(sow.document)

        # Delete the SOW
        await conn.execute('DELETE FROM sows WHERE id = $1;', id)
    
    # Log the activity
    await activity_service.log_activity(
        action="deleted",
        resource_type="sow",
        resource_name=str(sow.number),
        pool=pool
    )
    
    return sow


@router.get("/{sow_id}/chunks", response_model=ListResponse[SowChunk])
async def get_sow_chunks(sow_id: int, pool = Depends(get_db_connection_pool)):
    """Retrieves a list of SOW chunks from the database."""
    async with pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM sow_chunks WHERE sow_id = $1 ORDER BY page_number, heading;', sow_id)
        sow_chunks = parse_obj_as(list[SowChunk], [dict(row) for row in rows])
    return ListResponse[SowChunk](data=sow_chunks, total=len(sow_chunks), skip=0, limit=len(sow_chunks))
