from fpdf import FPDF
import os
import sys
import json
import argparse
from collections import defaultdict
import random
from datetime import datetime, timedelta

# Load configuration from the sow_inv.config file
def load_config(config_path):
    with open(config_path, 'r') as file:
        return json.load(file)

# Helper function to render table rows with proper text wrapping
def render_table_row(pdf, cell_data, cell_widths, min_height=10, border=1, align='L'):
    """
    Render a table row with proper text wrapping using multi_cell
    
    Args:
        pdf: FPDF object
        cell_data: List of strings for each cell
        cell_widths: List of widths for each cell
        min_height: Minimum height for the row
        border: Border style (0=none, 1=border)
        align: Text alignment ('L'=left, 'C'=center, 'R'=right) - can be string or list
    """
    # Handle alignment parameter
    if isinstance(align, str):
        alignments = [align] * len(cell_data)
    else:
        alignments = align
    
    # Calculate the required height for this row
    max_height = min_height
    start_x = pdf.get_x()
    start_y = pdf.get_y()
    
    # First pass: calculate the maximum height needed
    for i, (text, width) in enumerate(zip(cell_data, cell_widths)):
        # Save current position
        current_x = pdf.get_x()
        current_y = pdf.get_y()
        
        # Calculate how many lines this text will need
        pdf.set_xy(start_x + sum(cell_widths[:i]), start_y)
        
        # Use a temporary multi_cell to calculate height
        lines = len(pdf.multi_cell(width, min_height, txt=str(text), split_only=True))
        required_height = lines * min_height
        max_height = max(max_height, required_height)
        
        # Restore position
        pdf.set_xy(current_x, current_y)
    
    # Second pass: render all cells with the calculated height
    for i, (text, width, alignment) in enumerate(zip(cell_data, cell_widths, alignments)):
        x = start_x + sum(cell_widths[:i])
        y = start_y
        
        # Set position for this cell
        pdf.set_xy(x, y)
        
        # Draw border manually if needed
        if border:
            pdf.rect(x, y, width, max_height)
        
        # Render the text content with specified alignment
        pdf.multi_cell(width, min_height, txt=str(text), border=0, align=alignment)
    
    # Move to the next row
    pdf.set_xy(start_x, start_y + max_height)

# Create a function to generate an invoice PDF
def create_invoice(invoice_number, deliverables, vendor_info, client_info, output_path):
    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Arial", size=10)
    
    # Title
    pdf.set_font("Arial", style="B", size=12)
    pdf.cell(200, 10, txt=f"Invoice Number: {invoice_number}", ln=True, align="C")
    
    # Vendor Information
    pdf.set_font("Arial", style="B", size=10)
    pdf.cell(0, 10, txt=f"Vendor: {vendor_info['name']}", ln=True, align="L")
    pdf.set_font("Arial", size=10)
    pdf.cell(0, 10, txt=f"Address: {vendor_info['address']}", ln=True, align="L")
    pdf.cell(0, 10, txt=f"Contact Name: {vendor_info['contact_name']}", ln=True, align="L")
    pdf.cell(0, 10, txt=f"Contact Email: {vendor_info['contact_email']}", ln=True, align="L")
    pdf.cell(0, 10, txt=f"Contact Number: {vendor_info['contact_phone']}", ln=True, align="L")
    pdf.cell(0, 10, txt=f"SOW Number: {vendor_info['SOW']}", ln=True, align="L")
    
    # Calculate the invoice date as the due date minus 30 days
    due_date = datetime.strptime(deliverables[0]['due_date'], '%Y-%m-%d')
    invoice_date = due_date - timedelta(days=30)
    pdf.cell(0, 10, txt=f"Invoice Date: {invoice_date.strftime('%Y-%m-%d')}", ln=True, align="L")
      
    # Client Information
    pdf.set_font("Arial", style="B", size=10)
    pdf.cell(0, 10, txt=f"Client: {client_info['name']}", ln=True, align="L")
    pdf.set_font("Arial", size=10)
    pdf.cell(0, 10, txt=f"Contact Name: {client_info['contact_name']}", ln=True, align="L")
    pdf.cell(0, 10, txt=f"Contact Email: {client_info['contact_email']}", ln=True, align="L")
    pdf.ln(10)  # Added line

    # Invoice Details
    pdf.set_font("Arial", style="B", size=10)
    
    # Define column widths
    column_widths = [40, 80, 30, 40]
    
    # Table Header
    header_data = ["Milestone", "Deliverable", "Amount", "Due Date"]
    render_table_row(pdf, header_data, column_widths)
    pdf.set_font("Arial", size=10)

    total_amount = 0
    for deliverable in deliverables:
        row_data = [
            deliverable['name'],
            deliverable['deliverables'],
            deliverable['amount'],
            deliverable['due_date']
        ]
        render_table_row(pdf, row_data, column_widths)
        
        amount = float(deliverable['amount'].replace('$', '').replace(',', ''))
        total_amount += amount
    
    # Total Amount
    pdf.set_font("Arial", style="B", size=10)
    # Create merged columns: first 2 columns combined for "Total Amount", last 2 columns combined for amount
    total_column_widths = [120, 70]  # 40+80=120, 30+40=70
    total_row_data = ["Total Amount", f"${total_amount:,.2f}"]
    render_table_row(pdf, total_row_data, total_column_widths, align=['R', 'L'])
    pdf.ln(20)

    # Payment Instructions
    pdf.set_font("Arial", size=10)
    pdf.multi_cell(0, 10, txt=(
        f"If paying by Direct Credit please pay into the following bank account:\n"
        f"Account Name: {vendor_info['name']}\n"
        f"Account Number: {vendor_info['account_number']}\n"
        f"To help us allocate money correctly, please reference your invoice number: {invoice_number}\n\n"
        f"Payment Terms:\n{payment_info}\n"
    ))

    # Ensure the output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    # Output the PDF
    pdf.output(output_path)

if __name__ == "__main__":
    # Define the argument parser
    parser = argparse.ArgumentParser(description="Generate invoices for a given vendor.")
    parser.add_argument("vendor_name", type=str, help="The name of the vendor")
    parser.add_argument("config_file", type=str, nargs='?', default='sow_inv.config', help="The configuration file to use (default: sow_inv.config)")
    args = parser.parse_args()

    vendor_name = args.vendor_name
    config_file = args.config_file

    config_path = f'src/config/{config_file}'
    configs = load_config(config_path)
    
    # Find the vendor configuration by name
    vendor_config = next((config for config in configs if config['name'] == vendor_name), None)
    if not vendor_config:
        raise ValueError(f"Vendor '{vendor_name}' not found in configuration.")
    
    client_info = {
        "name": "Woodgrove Bank",
        "contact_name": "Chris Green",
        "contact_email": "chris.green@woodgrovebank.com"
    }

    # Extract payment terms and penalty from the configuration
    payment_terms = vendor_config['payments']['terms']
    penalty = vendor_config['payments']['penalty']

    # Use the extracted payment terms and penalty in the formatted strings
    payment_info = (
        f"- Payment is due within {payment_terms.split()[1]} days of the invoice date.\n"
        f"- A penalty of {penalty.split()[0]} will be applied for late payments."
    )

    # Group deliverables by invoice number
    grouped_deliverables = defaultdict(list)
    for deliverable in vendor_config['deliverables']:
        grouped_deliverables[deliverable['invoice#']].append(deliverable)

    # Generate invoices for each group of deliverables
    for invoice_num, deliverables in grouped_deliverables.items():
        # Generate the invoice number in the required format
        words = vendor_config['name'].split()
        invoice_prefix = f"{words[0][0]}{words[1][0]}" if len(words) > 1 else words[0][:2]
        invoice_number = f"INV-{invoice_prefix.upper()}2024-{invoice_num:03d}"
        output_path = f"../sample_docs/{invoice_number}.pdf"
        
        create_invoice(invoice_number, deliverables, vendor_config, client_info, output_path)