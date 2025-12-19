"""
Credential Store - Secure storage for database, SSH, and other credentials
In production, this should use a proper secrets manager like HashiCorp Vault
For POC/Demo, we use Redis with basic encryption
"""

import json
from typing import Dict, Optional, Any
from cryptography.fernet import Fernet
import base64
import os


class CredentialStore:
    def __init__(self, redis_client=None):
        """
        Initialize credential store
        For demo purposes, credentials are encrypted with a local key
        In production, use proper secrets management (Vault, AWS Secrets Manager, etc.)
        """
        # Generate or load encryption key
        self.encryption_key = self._get_or_create_key()
        self.cipher = Fernet(self.encryption_key)
        
        # Use in-memory storage for demo (could use Redis in production)
        self.credentials_store = {}
        self.redis_client = redis_client
        
        print("✓ Credential store initialized (in-memory with encryption)")
    
    def _get_or_create_key(self) -> bytes:
        """Get or create encryption key"""
        key_file = "/tmp/cred_store_key.key"
        
        if os.path.exists(key_file):
            with open(key_file, 'rb') as f:
                return f.read()
        else:
            key = Fernet.generate_key()
            with open(key_file, 'wb') as f:
                f.write(key)
            return key
    
    def _encrypt(self, data: str) -> str:
        """Encrypt data"""
        return self.cipher.encrypt(data.encode()).decode()
    
    def _decrypt(self, encrypted_data: str) -> str:
        """Decrypt data"""
        return self.cipher.decrypt(encrypted_data.encode()).decode()
    
    def store(self, node_id: str, node_type: str, credentials: Dict[str, str]):
        """
        Store credentials for a node
        
        Args:
            node_id: Unique identifier for the node
            node_type: Type of node (oracle, unix, etc.)
            credentials: Dictionary of credential key-value pairs
        """
        cred_data = {
            "node_id": node_id,
            "node_type": node_type,
            "credentials": credentials,
            "created_at": self._get_timestamp()
        }
        
        # Encrypt the entire credential object
        encrypted = self._encrypt(json.dumps(cred_data))
        
        # Store in memory
        self.credentials_store[node_id] = encrypted
        
        print(f"✓ Credentials stored for {node_type} node: {node_id}")
    
    def get(self, node_id: str) -> Optional[Dict[str, Any]]:
        """
        Retrieve credentials for a node
        
        Args:
            node_id: Unique identifier for the node
            
        Returns:
            Dictionary with node_type and credentials, or None if not found
        """
        encrypted = self.credentials_store.get(node_id)
        if not encrypted:
            return None
        
        try:
            decrypted = self._decrypt(encrypted)
            cred_data = json.loads(decrypted)
            return cred_data
        except Exception as e:
            print(f"Error decrypting credentials for {node_id}: {e}")
            return None
    
    def has_credentials(self, node_id: str) -> bool:
        """Check if credentials exist for a node"""
        return node_id in self.credentials_store
    
    def delete(self, node_id: str):
        """Delete credentials for a node"""
        if node_id in self.credentials_store:
            del self.credentials_store[node_id]
            print(f"✓ Credentials deleted for node: {node_id}")
    
    def list_nodes_with_credentials(self) -> list:
        """List all node IDs that have credentials stored"""
        return list(self.credentials_store.keys())
    
    def get_credential_summary(self, node_id: str) -> Optional[Dict[str, Any]]:
        """
        Get a summary of credentials (without exposing sensitive data)
        Useful for UI to show which credentials are configured
        """
        cred_data = self.get(node_id)
        if not cred_data:
            return None
        
        # Return sanitized version
        summary = {
            "node_id": node_id,
            "node_type": cred_data.get("node_type"),
            "created_at": cred_data.get("created_at"),
            "fields_configured": list(cred_data.get("credentials", {}).keys())
        }
        return summary
    
    def validate_credentials(self, node_type: str, credentials: Dict[str, str]) -> tuple:
        """
        Validate that required credentials are provided
        
        Returns:
            (is_valid: bool, missing_fields: list)
        """
        required_fields = {
            "oracle": ["host", "port", "service_name", "username", "password"],
            "unix": ["host", "port", "username"],  # password OR ssh_key required
            "reporting": [],  # Optional fields
            "llm": []  # No credentials needed (uses existing API)
        }
        
        required = required_fields.get(node_type, [])
        missing = []
        
        for field in required:
            if field not in credentials or not credentials[field]:
                missing.append(field)
        
        # Special case for Unix: must have password OR ssh_key
        if node_type == "unix":
            if not credentials.get("password") and not credentials.get("ssh_key"):
                missing.append("password_or_ssh_key")
        
        return (len(missing) == 0, missing)
    
    def _get_timestamp(self) -> str:
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().isoformat()
    
    def clear_all(self):
        """Clear all credentials (use with caution!)"""
        self.credentials_store.clear()
        print("✓ All credentials cleared")
    
    # ========================================================================
    # CREDENTIAL TESTING HELPERS
    # ========================================================================
    
    def get_oracle_connection_string(self, node_id: str) -> Optional[str]:
        """Generate Oracle connection string from stored credentials"""
        cred_data = self.get(node_id)
        if not cred_data or cred_data.get("node_type") != "oracle":
            return None
        
        creds = cred_data["credentials"]
        return f"{creds['username']}/{creds['password']}@{creds['host']}:{creds['port']}/{creds['service_name']}"
    
    def get_ssh_config(self, node_id: str) -> Optional[Dict[str, str]]:
        """Get SSH configuration from stored credentials"""
        cred_data = self.get(node_id)
        if not cred_data or cred_data.get("node_type") != "unix":
            return None
        
        creds = cred_data["credentials"]
        config = {
            "hostname": creds["host"],
            "port": int(creds.get("port", 22)),
            "username": creds["username"]
        }
        
        if creds.get("password"):
            config["password"] = creds["password"]
        elif creds.get("ssh_key"):
            config["pkey"] = creds["ssh_key"]
        
        return config
