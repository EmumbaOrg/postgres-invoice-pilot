from app.models.age_graph import VendorGraphData, SowGraphData, InvoiceGraphData

class AgeGraphService:
    """Service for managing Apache AGE graph operations to keep vendor_graph synchronized with public schema."""
    
    def __init__(self):
        self.graph_name = 'vendor_graph'
    
    async def _execute_graph_query(self, conn, sql: str):
        """Execute a graph query with proper search path setup."""
        # Set the search path to include ag_catalog for Apache AGE functions
        await conn.execute('SET search_path = ag_catalog, "$user", public;')
        # Execute the graph query
        await conn.execute(sql)
    
    # ==================== VENDOR OPERATIONS ====================
    
    async def add_vendor(self, conn, vendor_data: VendorGraphData) -> bool:
        """
        Add a vendor vertex to the Apache AGE graph.
        
        Args:
            conn: Database connection
            vendor_data: VendorGraphData schema with vendor information
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Escape single quotes in string values
            name = vendor_data.name.replace("'", "''")
            address = vendor_data.address.replace("'", "''")
            contact_name = vendor_data.contact_name.replace("'", "''")
            contact_email = vendor_data.contact_email.replace("'", "''")
            contact_phone = vendor_data.contact_phone.replace("'", "''")
            website = vendor_data.website.replace("'", "''")
            vendor_type = vendor_data.type.replace("'", "''")
            
            cypher_body = f"""
                CREATE (v:vendor {{
                    id: {vendor_data.id},
                    name: '{name}',
                    address: '{address}',
                    contact_name: '{contact_name}',
                    contact_email: '{contact_email}',
                    contact_phone: '{contact_phone}',
                    website: '{website}',
                    type: '{vendor_type}'
                }})
                RETURN v
            """
            
            sql = f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${cypher_body}$$) AS (result agtype);"""
            await self._execute_graph_query(conn, sql)
            
            return True
            
        except Exception as e:
            print(f"Error adding vendor vertex to graph: {e}")
            return False
    
    async def delete_vendor(self, conn, vendor_id: int) -> bool:
        """Delete a vendor vertex and all its relationships from the Apache AGE graph."""
        try:
            cypher_body = f"""
                MATCH (v:vendor {{id: {vendor_id}}})
                DETACH DELETE v
            """
            
            sql = f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${cypher_body}$$) AS (result agtype);"""
            await self._execute_graph_query(conn, sql)
            
            return True
            
        except Exception as e:
            print(f"Error deleting vendor vertex from graph: {e}")
            return False
    
    # ==================== SOW OPERATIONS ====================
    
    async def add_sow(self, conn, sow_data: SowGraphData) -> bool:
        """Add a SOW vertex to the Apache AGE graph."""
        try:
            # Convert date objects to strings for AGE compatibility
            start_date = sow_data.start_date.isoformat()
            end_date = sow_data.end_date.isoformat()
            
            # Escape single quotes in string values
            number = sow_data.number.replace("'", "''")
            
            cypher_body = f"""
                CREATE (s:sow {{
                    id: {sow_data.id},
                    number: '{number}',
                    vendor_id: {sow_data.vendor_id},
                    start_date: '{start_date}',
                    end_date: '{end_date}',
                    budget: {float(sow_data.budget)}
                }})
                RETURN s
            """
            
            sql = f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${cypher_body}$$) AS (result agtype);"""
            await self._execute_graph_query(conn, sql)
            
            return True
            
        except Exception as e:
            print(f"Error adding SOW vertex to graph: {e}")
            return False
    
    async def delete_sow(self, conn, sow_id: int) -> bool:
        """Delete a SOW vertex and all its relationships from the Apache AGE graph."""
        try:
            cypher_body = f"""
                MATCH (s:sow {{id: {sow_id}}})
                DETACH DELETE s
            """
            
            sql = f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${cypher_body}$$) AS (result agtype);"""
            await self._execute_graph_query(conn, sql)
            
            return True
            
        except Exception as e:
            print(f"Error deleting SOW vertex from graph: {e}")
            return False
    
    # ==================== INVOICE OPERATIONS ====================
    
    async def add_invoice(self, conn, invoice_data: InvoiceGraphData) -> bool:
        """Add an invoice as a has_invoices relationship between vendor and SOW."""
        try:
            # Convert date objects to strings for AGE compatibility
            invoice_date = invoice_data.invoice_date.isoformat()
            
            # Escape single quotes in string values
            number = invoice_data.number.replace("'", "''")
            payment_status = invoice_data.payment_status.replace("'", "''")
            
            cypher_body = f"""
                MATCH (v:vendor {{id: {invoice_data.vendor_id}}}), (s:sow {{id: {invoice_data.sow_id}}})
                CREATE (v)-[r:has_invoices {{
                    id: {invoice_data.id},
                    number: '{number}',
                    amount: {float(invoice_data.amount)},
                    invoice_date: '{invoice_date}',
                    payment_status: '{payment_status}'
                }}]->(s)
                RETURN r
            """
            
            sql = f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${cypher_body}$$) AS (result agtype);"""
            await self._execute_graph_query(conn, sql)
            
            return True
            
        except Exception as e:
            print(f"Error adding invoice relationship to graph: {e}")
            return False
    
    async def delete_invoice(self, conn, invoice_id: int) -> bool:
        """Delete an invoice (has_invoices relationship) from the Apache AGE graph."""
        try:
            cypher_body = f"""
                MATCH ()-[r:has_invoices {{id: {invoice_id}}}]->()
                DELETE r
            """
            
            sql = f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${cypher_body}$$) AS (result agtype);"""
            await self._execute_graph_query(conn, sql)
            
            return True
            
        except Exception as e:
            print(f"Error deleting invoice relationship from graph: {e}")
            return False