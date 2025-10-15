from fpdf import FPDF
import json
import argparse
from datetime import datetime
import os
import textwrap

# Load configuration from the config file
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
    
# Function to generate the SOW PDF
def generate_sow_pdf(output_path, vendor_name, vendor_config):
    # Replace placeholders in compliance section and wrap text
    for i, item in enumerate(vendor_config['compliance']):
        item = item.replace("{name}", vendor_config['name'])
        vendor_config['compliance'][i] = textwrap.fill(item, width=100)

    pdf = FPDF()
    pdf.set_auto_page_break(auto=True, margin=15)
    pdf.add_page()
    pdf.set_font("Arial", size=10)

    # Title
    pdf.set_font("Arial", style="B", size=12)
    pdf.cell(200, 10, txt="Statement of Work", ln=True, align="C")
    pdf.ln(10)

    # Project Details
    pdf.set_font("Arial", style="B", size=10)
    pdf.cell(0, 10, txt=f"Project Name: {vendor_config['project_name']}", ln=True)
    pdf.cell(0, 10, txt=f"Effective Date: {vendor_config['start_date']}", ln=True)
    pdf.cell(0, 10, txt=f"Project Completion Date: {vendor_config['completion_date']}", ln=True)
    pdf.cell(0, 10, txt=f"SOW Number: {vendor_config['SOW']}", ln=True)

    # Section Headers and Content
    sections = {
        "Project Scope": vendor_config['project_scope'],
        "Project Objectives": vendor_config['project_objectives'],
        "Tasks": vendor_config['tasks'],
        "Schedules": vendor_config['schedules'],
        "Requirements": vendor_config['requirements'],
        "Payments": vendor_config['payments'],
        "Compliance": vendor_config['compliance']
    }

    for section, content in sections.items():
        pdf.set_font("Arial", style="B", size=10)
        pdf.cell(0, 10, txt=section, ln=True)
        pdf.set_font("Arial", size=10)
        if isinstance(content, list):
            for item in content:
                if isinstance(item, dict):
                    for key, value in item.items():
                        pdf.cell(0, 10, txt=f"{key}: {value}", ln=True)
                else:
                    pdf.multi_cell(0, 10, txt=f"- {item}")
        elif isinstance(content, dict):
            for key, value in content.items():
                pdf.cell(0, 10, txt=f"{key}: {value}", ln=True)
        else:
            pdf.multi_cell(0, 10, txt=content)
        pdf.ln(10)
        
        # Insert a page break after the "Tasks" section
        if section == "Tasks":
            pdf.add_page()

    # Deliverables Table
    pdf.set_font("Arial", style="B", size=10)
    pdf.cell(0, 10, txt="Project Deliverables", ln=True)
    pdf.set_font("Arial", size=10)

    # Define column widths
    column_widths = [20, 40, 80, 30, 30]
    
    # Table Header
    header_data = ["Item", "Milestone Name", "Deliverables", "Amount", "Due Date"]
    pdf.set_font("Arial", style="B", size=10)
    render_table_row(pdf, header_data, column_widths)
    pdf.set_font("Arial", size=10)

    # Table Content
    total_amount = 0
    for deliverable in vendor_config['deliverables']:
        row_data = [
            str(deliverable['number']),
            deliverable['name'],
            deliverable['deliverables'],
            deliverable['amount'],
            deliverable['due_date']
        ]
        render_table_row(pdf, row_data, column_widths)
        
        # Sum the amounts
        amount = float(deliverable['amount'].replace('$', '').replace(',', ''))
        total_amount += amount

    # Total Amount
    pdf.set_font("Arial", style="B", size=10)
    # Create merged columns: first 3 columns combined for "Total", last 2 columns combined for amount
    total_column_widths = [140, 60]  # 20+40+80=140, 30+30=60
    total_row_data = ["Total", f"${total_amount:,.2f}"]
    render_table_row(pdf, total_row_data, total_column_widths, align=['R', 'L'])
    pdf.ln()

    # Signatures
    pdf.ln(20)
    pdf.set_font("Arial", style="B", size=10)
    pdf.cell(0, 10, txt="Signatures", ln=True)
    pdf.ln(10)
    pdf.set_font("Arial", size=10)
    pdf.cell(0, 10, txt=f"________________ ({vendor_config['name']} - {vendor_config['contact_name']})", ln=True)
    pdf.cell(0, 10, txt="________________ (Woodgrove Bank - Chris Green)", ln=True)

    # Ensure the output directory exists
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    pdf.output(output_path)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Statement of Work PDF")
    parser.add_argument("vendor_name", type=str, help="The name of the vendor")
    parser.add_argument("config_file", type=str, nargs='?', default='sow_inv.config', help="The configuration file to use (default: sow_inv.config)")
    args = parser.parse_args()

    vendor_name = args.vendor_name
    config_file = args.config_file

    config_path = f'src/config/{config_file}'
    configs = load_config(config_path)
    
    vendor_config = next((config for config in configs if config['name'] == vendor_name), None)
    if not vendor_config:
        raise ValueError(f"Vendor '{vendor_name}' not found in configuration.")
    
    name = vendor_config['name'].replace(" ", "_").replace(".", "")
    start_date_str = vendor_config.get('start_date', "")
    if not start_date_str:
        raise ValueError(f"Start date not found for vendor '{vendor_name}'")
    
    start_date = datetime.strptime(start_date_str, "%B %d, %Y").strftime("%Y%m%d")
    output_path = f"../sample_docs/Statement_of_Work_{name}_Woodgrove_Bank_{start_date}.pdf"
    generate_sow_pdf(output_path, vendor_name, vendor_config)