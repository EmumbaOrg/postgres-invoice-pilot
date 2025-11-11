from pydantic import BaseModel
from datetime import date
from decimal import Decimal

class VendorGraphData(BaseModel):
    id: int
    name: str
    address: str
    contact_name: str
    contact_email: str
    contact_phone: str
    website: str
    type: str

class SowGraphData(BaseModel):
    id: int
    number: str
    vendor_id: int
    start_date: date
    end_date: date
    budget: Decimal

class InvoiceGraphData(BaseModel):
    id: int
    vendor_id: int
    sow_id: int
    number: str
    amount: Decimal
    invoice_date: date
    payment_status: str