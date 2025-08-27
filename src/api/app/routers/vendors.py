from app.lifespan_manager import get_db_connection_pool, get_storage_service, get_activity_log_service
from app.models import Vendor, VendorEdit, ListResponse
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import parse_obj_as

# Initialize the router
router = APIRouter(
    prefix = "/vendors",
    tags = ["Vendors"],
    dependencies = [Depends(get_db_connection_pool)],
    responses = {404: {"description": "Not found"}}
)

@router.get('/', response_model = ListResponse[Vendor])
async def list_vendors(skip: int = 0, limit: int = 10, sortby: str = None, pool = Depends(get_db_connection_pool)):
    """Retrieves a list of vendors from the database."""
    async with pool.acquire() as conn:
        orderby = 'id'
        if (sortby):
            orderby = sortby

        if limit == -1:
            rows = await conn.fetch('SELECT * FROM vendors ORDER BY $1;', orderby)
        else:
            rows = await conn.fetch('SELECT * FROM vendors ORDER BY $1 LIMIT $2 OFFSET $3;', orderby, limit, skip)

        vendors = parse_obj_as(list[Vendor], [dict(row) for row in rows])

        total = await conn.fetchval('SELECT COUNT(*) FROM vendors;')

    if (limit == -1):
        limit = total

    return ListResponse[Vendor](data = vendors, total = len(vendors), skip = 0, limit = len(vendors))



@router.post('/', response_model=Vendor, status_code=status.HTTP_201_CREATED)
async def add_vendor(vendor: VendorEdit, pool = Depends(get_db_connection_pool), activity_service = Depends(get_activity_log_service)):
    """Adds a new vendor to the database."""
    
    async with pool.acquire() as conn:   
        existing = await conn.fetchrow('SELECT id FROM vendors WHERE contact_email = $1;', vendor.contact_email)
        if existing:
            raise HTTPException(status_code=409, detail='A vendor with this email already exists.')
      
        row = await conn.fetchrow(
            '''INSERT INTO vendors (name, type, contact_name, contact_phone, contact_email, website, address)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *;''',
            vendor.name,
            vendor.type,
            vendor.contact_name,
            vendor.contact_phone,
            vendor.contact_email,
            vendor.website,
            vendor.address
        )

        if row is None:
            raise HTTPException(status_code=500, detail='Failed to add vendor.')

        # Log the activity
        await activity_service.log_activity(
            action="created",
            resource_type="vendor",
            resource_name=vendor.name,
            pool=pool
        )

        return parse_obj_as(Vendor, dict(row))


@router.get('/{id:int}', response_model = Vendor)
async def get_by_id(id: int, pool = Depends(get_db_connection_pool)):
    """Retrieves a vendor by ID from the database."""
    async with pool.acquire() as conn:
        row = await conn.fetchrow('SELECT * FROM vendors WHERE id = $1;', id)
        if row is None:
            raise HTTPException(status_code=404, detail=f'A vendor with an id of {id} was not found.')
        vendor = parse_obj_as(Vendor, dict(row))
    return vendor

@router.get('/type/{type}', response_model = list[Vendor])
async def get_by_type(type: str, pool = Depends(get_db_connection_pool)):
    """Retrieves vendors of the specified type from the database."""
    async with pool.acquire() as conn:
        rows = await conn.fetch('SELECT * FROM vendors WHERE LOWER(type) = $1;', type.lower())
        if not rows or len(rows) == 0:
            raise HTTPException(status_code=404, detail=f'No vendors with a type of "{type}" were found.')
        vendors = parse_obj_as(list[Vendor], [dict(row) for row in rows])
    return vendors

@router.delete('/{id:int}', status_code=204)
async def delete_vendor(id: int, pool = Depends(get_db_connection_pool), activity_service = Depends(get_activity_log_service), storage_service = Depends(get_storage_service)
):
    """ Deletes a vendor and all its associated records """

    async with pool.acquire() as conn:
        # collect blob storage paths of SOW and INVOICE files uploaded by this vendor
        sow_docs = await conn.fetch('SELECT document FROM sows where vendor_id = $1', id)
        invoice_docs = await conn.fetch('SELECT document FROM invoices where vendor_id = $1', id)

        # fetch vendor name for logging
        vendor = await conn.fetchrow('SELECT name FROM vendors WHERE id = $1;', id)
        vendor_name = vendor['name'] if vendor else 'unknown'

        # delete the vendor
        result = await conn.execute('DELETE FROM vendors WHERE id = $1;', id)
        if result == 'DELETE 0':
            raise HTTPException(status_code=404, detail='Vendor not found.')
        
        # delete associated SOW and INVOICE files from blob storage
        for doc in sow_docs + invoice_docs:
            if doc['document']:
                result = await storage_service.delete_document(doc['document'])

        # Log the activity
        await activity_service.log_activity(
            action="deleted",
            resource_type="vendor",
            resource_name=vendor_name,
            pool=pool
        )
