from app.models.age_graph import VendorGraphData, SowGraphData, InvoiceGraphData

class GraphRepository:
    """Repository for managing Apache AGE graph operations to keep vendor_graph synchronized with public schema."""
    
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
                    id: '{vendor_data.id}',
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
    
    async def delete_vendor_with_cascade(self, conn, vendor_id: int) -> bool:
        """Delete a vendor and all its associated SOWs and invoices (cascade behavior)."""
        
        try:
            # Delete all invoices associated with this vendor's SOWs
            delete_invoices_cypher = f"""
                MATCH (v:vendor {{id: '{vendor_id}'}})-[r:has_invoices]->()
                DELETE r
            """
            
            # Delete all SOWs associated with this vendor
            delete_sows_cypher = f"""
                MATCH (v:vendor {{id: '{vendor_id}'}})
                MATCH (s:sow {{vendor_id: '{vendor_id}'}})
                DETACH DELETE s
            """
            
            # Delete the vendor itself
            delete_vendor_cypher = f"""
                MATCH (v:vendor {{id: '{vendor_id}'}})
                DETACH DELETE v
            """
            
            # Execute all deletions in order
            await self._execute_graph_query(conn, f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${delete_invoices_cypher}$$) AS (result agtype);""")
            await self._execute_graph_query(conn, f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${delete_sows_cypher}$$) AS (result agtype);""")
            await self._execute_graph_query(conn, f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${delete_vendor_cypher}$$) AS (result agtype);""")
            
            return True
            
        except Exception as e:
            print(f"Error cascading delete vendor from graph: {e}")
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
                    id: '{sow_data.id}',
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
    
    async def delete_sow_with_cascade(self, conn, sow_id: int) -> bool:
        """Delete a SOW and all its associated invoices (cascade behavior)."""
        try:
            # Delete all invoices associated with this SOW
            delete_invoices_cypher = f"""
                MATCH ()-[r:has_invoices]->(s:sow {{id: '{sow_id}'}})
                DELETE r
            """
            
            # Delete the SOW itself
            delete_sow_cypher = f"""
                MATCH (s:sow {{id: '{sow_id}'}})
                DETACH DELETE s
            """
            
            # Execute deletions in order
            await self._execute_graph_query(conn, f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${delete_invoices_cypher}$$) AS (result agtype);""")
            await self._execute_graph_query(conn, f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${delete_sow_cypher}$$) AS (result agtype);""")
            
            return True
            
        except Exception as e:
            print(f"Error cascading delete SOW from graph: {e}")
            return False
    
    async def update_sow(self, conn, sow_data: SowGraphData) -> bool:
        """
        Update a SOW vertex in the Apache AGE graph.
        
        Args:
            conn: Database connection
            sow_data: SowGraphData schema with updated SOW information
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Convert date objects to strings for AGE compatibility
            start_date = sow_data.start_date.isoformat()
            end_date = sow_data.end_date.isoformat()
            
            # Escape single quotes in string values
            number = sow_data.number.replace("'", "''")
            
            cypher_body = f"""
                MATCH (s:sow {{id: '{sow_data.id}'}})
                SET s.number = '{number}',
                    s.vendor_id = {sow_data.vendor_id},
                    s.start_date = '{start_date}',
                    s.end_date = '{end_date}',
                    s.budget = {float(sow_data.budget)}
                RETURN s
            """
            
            sql = f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${cypher_body}$$) AS (result agtype);"""
            await self._execute_graph_query(conn, sql)
            
            return True
            
        except Exception as e:
            print(f"Error updating SOW vertex in graph: {e}")
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
                MATCH (v:vendor {{id: '{invoice_data.vendor_id}'}}), (s:sow {{id: '{invoice_data.sow_id}'}})
                CREATE (v)-[r:has_invoices {{
                    id: '{invoice_data.id}',
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
                MATCH ()-[r:has_invoices {{id: '{invoice_id}'}}]->()
                DELETE r
            """
            
            sql = f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${cypher_body}$$) AS (result agtype);"""
            await self._execute_graph_query(conn, sql)
            
            return True
            
        except Exception as e:
            print(f"Error deleting invoice relationship from graph: {e}")
            return False
        
    async def update_invoice(self, conn, invoice_data: InvoiceGraphData) -> bool:
        """
        Update an invoice (has_invoices relationship) in the Apache AGE graph.
        
        Args:
            conn: Database connection
            invoice_data: InvoiceGraphData schema with updated invoice information
        
        Returns:
            bool: True if successful, False otherwise
        """
        try:
            # Convert date objects to strings for AGE compatibility
            invoice_date = invoice_data.invoice_date.isoformat()
            
            # Escape single quotes in string values
            number = invoice_data.number.replace("'", "''")
            payment_status = invoice_data.payment_status.replace("'", "''")
            
            cypher_body = f"""
                MATCH ()-[r:has_invoices {{id: '{invoice_data.id}'}}]->()
                SET r.number = '{number}',
                    r.amount = {float(invoice_data.amount)},
                    r.invoice_date = '{invoice_date}',
                    r.payment_status = '{payment_status}'
                RETURN r
            """
            print(f"\nUpdating Invoice with data: {cypher_body} \n")
            sql = f"""SELECT * FROM ag_catalog.cypher('{self.graph_name}', $${cypher_body}$$) AS (result agtype);"""
            await self._execute_graph_query(conn, sql)
            
            return True
            
        except Exception as e:
            print(f"Error updating invoice relationship in graph: {e}")
            return False    