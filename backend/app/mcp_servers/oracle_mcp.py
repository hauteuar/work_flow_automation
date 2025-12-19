"""
Oracle MCP Server - Database operations for pricing workflows
Handles queries, stored procedures, and pricing-specific operations
"""

import cx_Oracle
from typing import Dict, Any, List, Optional, Tuple
import json
from datetime import datetime


class OracleMCPServer:
    def __init__(self):
        self.connection = None
        self.cursor = None
        self.credentials = None
        print("✓ Oracle MCP Server initialized")
    
    def connect(self, credentials: Dict[str, str]) -> Tuple[bool, str]:
        """
        Establish connection to Oracle database
        
        Args:
            credentials: Dictionary with host, port, service_name, username, password
            
        Returns:
            (success: bool, message: str)
        """
        try:
            self.credentials = credentials
            
            # Build connection string
            dsn = cx_Oracle.makedsn(
                credentials['host'],
                credentials['port'],
                service_name=credentials['service_name']
            )
            
            # Create connection
            self.connection = cx_Oracle.connect(
                user=credentials['username'],
                password=credentials['password'],
                dsn=dsn,
                encoding="UTF-8"
            )
            
            self.cursor = self.connection.cursor()
            
            # Test connection
            self.cursor.execute("SELECT 'Connection successful' FROM DUAL")
            result = self.cursor.fetchone()
            
            return (True, f"✓ Connected to Oracle: {credentials['host']}:{credentials['port']}/{credentials['service_name']}")
            
        except cx_Oracle.Error as e:
            error_obj, = e.args
            return (False, f"✗ Oracle connection failed: {error_obj.message}")
        except Exception as e:
            return (False, f"✗ Connection failed: {str(e)}")
    
    def disconnect(self):
        """Close database connection"""
        try:
            if self.cursor:
                self.cursor.close()
            if self.connection:
                self.connection.close()
            print("✓ Oracle connection closed")
        except:
            pass
    
    def test_connection(self) -> Dict[str, Any]:
        """Test if connection is active"""
        try:
            if not self.connection:
                return {"success": False, "message": "No connection established"}
            
            self.cursor.execute("SELECT SYSDATE FROM DUAL")
            result = self.cursor.fetchone()
            
            return {
                "success": True,
                "message": "Connection active",
                "server_time": str(result[0])
            }
        except Exception as e:
            return {"success": False, "message": f"Connection test failed: {str(e)}"}
    
    # ========================================================================
    # GENERIC QUERY OPERATIONS
    # ========================================================================
    
    def execute_query(self, sql: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Execute a SQL query and return results
        
        Args:
            sql: SQL query string
            params: Optional parameters for query
            
        Returns:
            Dictionary with results and metadata
        """
        try:
            if params:
                self.cursor.execute(sql, params)
            else:
                self.cursor.execute(sql)
            
            # Get column names
            columns = [desc[0] for desc in self.cursor.description] if self.cursor.description else []
            
            # Fetch results
            rows = self.cursor.fetchall()
            
            # Convert to list of dictionaries
            results = []
            for row in rows:
                row_dict = {}
                for i, col in enumerate(columns):
                    # Convert Oracle types to JSON-serializable types
                    value = row[i]
                    if isinstance(value, datetime):
                        value = value.isoformat()
                    elif isinstance(value, (cx_Oracle.LOB, cx_Oracle.CLOB)):
                        value = value.read()
                    row_dict[col] = value
                results.append(row_dict)
            
            return {
                "success": True,
                "row_count": len(results),
                "columns": columns,
                "data": results
            }
            
        except cx_Oracle.Error as e:
            error_obj, = e.args
            return {
                "success": False,
                "error": error_obj.message,
                "sql": sql
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "sql": sql
            }
    
    def execute_dml(self, sql: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """
        Execute DML (INSERT, UPDATE, DELETE) and commit
        
        Args:
            sql: DML statement
            params: Optional parameters
            
        Returns:
            Dictionary with execution result
        """
        try:
            if params:
                self.cursor.execute(sql, params)
            else:
                self.cursor.execute(sql)
            
            self.connection.commit()
            
            return {
                "success": True,
                "rows_affected": self.cursor.rowcount,
                "message": f"DML executed successfully, {self.cursor.rowcount} rows affected"
            }
            
        except cx_Oracle.Error as e:
            self.connection.rollback()
            error_obj, = e.args
            return {
                "success": False,
                "error": error_obj.message,
                "sql": sql
            }
        except Exception as e:
            self.connection.rollback()
            return {
                "success": False,
                "error": str(e),
                "sql": sql
            }
    
    # ========================================================================
    # PRICING-SPECIFIC OPERATIONS
    # ========================================================================
    
    def check_pricing_status(self, cusip: str) -> Dict[str, Any]:
        """
        Check pricing status for a specific CUSIP
        This is a demo query - adjust table/column names for your actual schema
        """
        sql = """
            SELECT 
                cusip,
                security_name,
                price,
                pricing_date,
                pricing_status,
                error_code,
                last_updated
            FROM pricing_master
            WHERE cusip = :cusip
            ORDER BY pricing_date DESC
            FETCH FIRST 1 ROW ONLY
        """
        
        result = self.execute_query(sql, {"cusip": cusip})
        
        if result["success"] and result["row_count"] > 0:
            pricing_data = result["data"][0]
            return {
                "success": True,
                "cusip": cusip,
                "status": pricing_data.get("PRICING_STATUS"),
                "price": pricing_data.get("PRICE"),
                "error_code": pricing_data.get("ERROR_CODE"),
                "last_updated": pricing_data.get("LAST_UPDATED"),
                "details": pricing_data
            }
        else:
            return {
                "success": False,
                "cusip": cusip,
                "message": "CUSIP not found in pricing master table"
            }
    
    def get_failed_pricings(self, date: Optional[str] = None) -> Dict[str, Any]:
        """
        Get all failed pricings for a specific date
        
        Args:
            date: Date in YYYY-MM-DD format, defaults to today
        """
        if not date:
            date = datetime.now().strftime("%Y-%m-%d")
        
        sql = """
            SELECT 
                cusip,
                security_name,
                error_code,
                error_message,
                pricing_date,
                last_updated
            FROM pricing_master
            WHERE pricing_status = 'FAILED'
              AND TRUNC(pricing_date) = TO_DATE(:pricing_date, 'YYYY-MM-DD')
            ORDER BY last_updated DESC
        """
        
        return self.execute_query(sql, {"pricing_date": date})
    
    def get_pricing_by_error_code(self, error_code: str) -> Dict[str, Any]:
        """Get all pricings with a specific error code"""
        sql = """
            SELECT 
                cusip,
                security_name,
                error_code,
                error_message,
                pricing_date,
                last_updated
            FROM pricing_master
            WHERE error_code = :error_code
              AND TRUNC(pricing_date) = TRUNC(SYSDATE)
            ORDER BY last_updated DESC
        """
        
        return self.execute_query(sql, {"error_code": error_code})
    
    def update_pricing_status(self, cusip: str, status: str, error_code: Optional[str] = None) -> Dict[str, Any]:
        """
        Update pricing status for a CUSIP
        
        Args:
            cusip: CUSIP identifier
            status: New status (e.g., 'PROCESSING', 'COMPLETED', 'FAILED')
            error_code: Optional error code if failed
        """
        if error_code:
            sql = """
                UPDATE pricing_master
                SET pricing_status = :status,
                    error_code = :error_code,
                    last_updated = SYSDATE
                WHERE cusip = :cusip
                  AND TRUNC(pricing_date) = TRUNC(SYSDATE)
            """
            params = {"status": status, "error_code": error_code, "cusip": cusip}
        else:
            sql = """
                UPDATE pricing_master
                SET pricing_status = :status,
                    error_code = NULL,
                    last_updated = SYSDATE
                WHERE cusip = :cusip
                  AND TRUNC(pricing_date) = TRUNC(SYSDATE)
            """
            params = {"status": status, "cusip": cusip}
        
        return self.execute_dml(sql, params)
    
    def get_table_info(self, table_name: str) -> Dict[str, Any]:
        """Get information about a table's structure"""
        sql = """
            SELECT 
                column_name,
                data_type,
                data_length,
                nullable
            FROM user_tab_columns
            WHERE table_name = :table_name
            ORDER BY column_id
        """
        
        return self.execute_query(sql, {"table_name": table_name.upper()})
    
    def execute_stored_procedure(self, proc_name: str, params: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute a stored procedure
        
        Args:
            proc_name: Name of the stored procedure
            params: Dictionary of parameter name -> value
        """
        try:
            # Build parameter list
            param_list = ', '.join([f":{key}" for key in params.keys()])
            call_sql = f"BEGIN {proc_name}({param_list}); END;"
            
            self.cursor.execute(call_sql, params)
            self.connection.commit()
            
            return {
                "success": True,
                "message": f"Stored procedure {proc_name} executed successfully"
            }
            
        except cx_Oracle.Error as e:
            self.connection.rollback()
            error_obj, = e.args
            return {
                "success": False,
                "error": error_obj.message,
                "procedure": proc_name
            }
        except Exception as e:
            self.connection.rollback()
            return {
                "success": False,
                "error": str(e),
                "procedure": proc_name
            }
    
    # ========================================================================
    # METADATA & UTILITIES
    # ========================================================================
    
    def get_server_info(self) -> Dict[str, Any]:
        """Get Oracle server information"""
        try:
            queries = {
                "version": "SELECT * FROM v$version WHERE banner LIKE 'Oracle%'",
                "instance": "SELECT instance_name, host_name, version FROM v$instance",
                "database": "SELECT name, open_mode FROM v$database"
            }
            
            info = {}
            for key, sql in queries.items():
                result = self.execute_query(sql)
                if result["success"]:
                    info[key] = result["data"]
            
            return {"success": True, "info": info}
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def __del__(self):
        """Cleanup on deletion"""
        self.disconnect()
