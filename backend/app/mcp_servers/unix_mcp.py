"""
Unix MCP Server - SSH operations for pricing job management
Handles command execution, log reading, file operations, and job control
"""

import paramiko
from typing import Dict, Any, List, Optional, Tuple
import io
import time
from datetime import datetime


class UnixMCPServer:
    def __init__(self):
        self.ssh_client = None
        self.sftp_client = None
        self.credentials = None
        print("✓ Unix MCP Server initialized")
    
    def connect(self, credentials: Dict[str, str]) -> Tuple[bool, str]:
        """
        Establish SSH connection to Unix server
        
        Args:
            credentials: Dictionary with host, port, username, and password or ssh_key
            
        Returns:
            (success: bool, message: str)
        """
        try:
            self.credentials = credentials
            self.ssh_client = paramiko.SSHClient()
            self.ssh_client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            
            # Prepare connection parameters
            connect_params = {
                'hostname': credentials['host'],
                'port': int(credentials.get('port', 22)),
                'username': credentials['username'],
                'timeout': 10
            }
            
            # Use password or SSH key
            if credentials.get('password'):
                connect_params['password'] = credentials['password']
            elif credentials.get('ssh_key'):
                # Load SSH key from string
                key_file = io.StringIO(credentials['ssh_key'])
                try:
                    pkey = paramiko.RSAKey.from_private_key(key_file)
                except:
                    try:
                        key_file.seek(0)
                        pkey = paramiko.Ed25519Key.from_private_key(key_file)
                    except:
                        key_file.seek(0)
                        pkey = paramiko.ECDSAKey.from_private_key(key_file)
                connect_params['pkey'] = pkey
            else:
                return (False, "✗ No password or SSH key provided")
            
            # Connect
            self.ssh_client.connect(**connect_params)
            
            # Test connection
            stdin, stdout, stderr = self.ssh_client.exec_command('echo "SSH connection successful"')
            output = stdout.read().decode().strip()
            
            # Initialize SFTP for file operations
            self.sftp_client = self.ssh_client.open_sftp()
            
            return (True, f"✓ Connected to {credentials['host']} as {credentials['username']}")
            
        except paramiko.AuthenticationException:
            return (False, "✗ Authentication failed - check username/password or SSH key")
        except paramiko.SSHException as e:
            return (False, f"✗ SSH connection failed: {str(e)}")
        except Exception as e:
            return (False, f"✗ Connection failed: {str(e)}")
    
    def disconnect(self):
        """Close SSH connection"""
        try:
            if self.sftp_client:
                self.sftp_client.close()
            if self.ssh_client:
                self.ssh_client.close()
            print("✓ SSH connection closed")
        except:
            pass
    
    def test_connection(self) -> Dict[str, Any]:
        """Test if SSH connection is active"""
        try:
            if not self.ssh_client:
                return {"success": False, "message": "No SSH connection established"}
            
            stdin, stdout, stderr = self.ssh_client.exec_command('hostname && date')
            output = stdout.read().decode().strip()
            error = stderr.read().decode().strip()
            
            if error:
                return {"success": False, "message": f"Test failed: {error}"}
            
            return {
                "success": True,
                "message": "SSH connection active",
                "output": output
            }
        except Exception as e:
            return {"success": False, "message": f"Connection test failed: {str(e)}"}
    
    def execute_command(self, command: str, timeout: int = 30) -> Dict[str, Any]:
        """Execute a shell command"""
        try:
            stdin, stdout, stderr = self.ssh_client.exec_command(command, timeout=timeout)
            exit_code = stdout.channel.recv_exit_status()
            output = stdout.read().decode()
            error = stderr.read().decode()
            
            return {
                "success": exit_code == 0,
                "exit_code": exit_code,
                "stdout": output,
                "stderr": error,
                "command": command
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "command": command
            }
    
    def tail_file(self, remote_path: str, lines: int = 100) -> Dict[str, Any]:
        """Read last N lines of a file"""
        command = f"tail -n {lines} {remote_path}"
        result = self.execute_command(command)
        
        if result["success"]:
            return {
                "success": True,
                "path": remote_path,
                "content": result["stdout"],
                "lines": lines
            }
        else:
            return {
                "success": False,
                "error": result.get("stderr") or result.get("error"),
                "path": remote_path
            }
    
    def grep_file(self, remote_path: str, pattern: str, context_lines: int = 2) -> Dict[str, Any]:
        """Search for pattern in file"""
        command = f"grep -C {context_lines} '{pattern}' {remote_path}"
        result = self.execute_command(command)
        
        if result["exit_code"] in [0, 1]:
            return {
                "success": True,
                "path": remote_path,
                "pattern": pattern,
                "matches": result["stdout"],
                "match_found": result["exit_code"] == 0
            }
        else:
            return {
                "success": False,
                "error": result.get("stderr"),
                "path": remote_path
            }
    
    def check_pricing_job_logs(self, cusip: str, log_path: str = "/app/pricing/logs") -> Dict[str, Any]:
        """Check pricing job logs for a specific CUSIP"""
        today = datetime.now().strftime("%Y%m%d")
        log_file = f"{log_path}/pricing_job_{today}.log"
        result = self.grep_file(log_file, cusip, context_lines=5)
        
        if result["success"] and result["match_found"]:
            return {
                "success": True,
                "cusip": cusip,
                "log_file": log_file,
                "log_entries": result["matches"],
                "message": f"Found log entries for CUSIP {cusip}"
            }
        elif result["success"] and not result["match_found"]:
            return {
                "success": True,
                "cusip": cusip,
                "log_file": log_file,
                "log_entries": "",
                "message": f"No log entries found for CUSIP {cusip}"
            }
        else:
            return {
                "success": False,
                "error": result.get("error"),
                "cusip": cusip
            }
    
    def restart_pricing_job(self, cusip: Optional[str] = None, job_script: str = "/app/pricing/bin/restart_pricing.sh") -> Dict[str, Any]:
        """Restart pricing job"""
        if cusip:
            command = f"{job_script} {cusip}"
            message = f"Restarting pricing job for CUSIP {cusip}"
        else:
            command = f"{job_script} --all-failed"
            message = "Restarting all failed pricing jobs"
        
        result = self.execute_command(command, timeout=60)
        
        if result["success"]:
            return {
                "success": True,
                "message": message,
                "output": result["stdout"]
            }
        else:
            return {
                "success": False,
                "error": result.get("stderr") or result.get("error"),
                "message": f"Failed to restart pricing job"
            }
    
    def __del__(self):
        """Cleanup on deletion"""
        self.disconnect()
