import redis
import json
import hashlib
import pickle
from typing import Optional, Any
from datetime import datetime
from config import settings

class RedisCache:
    """
    Redis cache with intelligent compression and stats tracking
    """
    
    def __init__(self):
        try:
            self.client = redis.Redis(
                host=settings.REDIS_HOST,
                port=settings.REDIS_PORT,
                db=settings.REDIS_DB,
                password=settings.REDIS_PASSWORD,
                decode_responses=False  # Handle binary data
            )
            self.client.ping()
            self.available = True
            print(f"✓ Redis connected at {settings.REDIS_HOST}:{settings.REDIS_PORT}")
            
            # Initialize stats
            self._init_stats()
            
        except Exception as e:
            print(f"✗ Redis connection failed: {e}")
            print("  Falling back to in-memory cache")
            self.client = None
            self.available = False
            self.memory_cache = {}
    
    def _init_stats(self):
        """Initialize cache statistics"""
        if not self.available:
            return
        
        if not self.client.exists('cache:stats'):
            stats = {
                'hits': 0,
                'misses': 0,
                'total_size': 0,
                'evictions': 0
            }
            self.client.set('cache:stats', json.dumps(stats))
    
    def _generate_key(self, prefix: str, data: Any) -> str:
        """Generate cache key from data"""
        if isinstance(data, str):
            content = data
        else:
            content = json.dumps(data, sort_keys=True)
        
        hash_obj = hashlib.sha256(content.encode())
        return f"{prefix}:{hash_obj.hexdigest()[:16]}"
    
    def get(self, key: str) -> Optional[Any]:
        """Get value from cache"""
        if self.available:
            try:
                value = self.client.get(key)
                if value:
                    self._increment_stat('hits')
                    # Try to unpickle, fallback to decode
                    try:
                        return pickle.loads(value)
                    except:
                        return value.decode('utf-8')
                else:
                    self._increment_stat('misses')
                    return None
            except Exception as e:
                print(f"Cache get error: {e}")
                return None
        else:
            self._increment_stat('misses' if key not in self.memory_cache else 'hits')
            return self.memory_cache.get(key)
    
    def set(self, key: str, value: Any, ttl: int = 3600) -> bool:
        """Set value in cache with TTL"""
        if self.available:
            try:
                # Serialize value
                serialized = pickle.dumps(value)
                self.client.setex(key, ttl, serialized)
                return True
            except Exception as e:
                print(f"Cache set error: {e}")
                return False
        else:
            self.memory_cache[key] = value
            return True
    
    def delete(self, key: str) -> bool:
        """Delete key from cache"""
        if self.available:
            try:
                self.client.delete(key)
                return True
            except:
                return False
        else:
            if key in self.memory_cache:
                del self.memory_cache[key]
            return True
    
    def exists(self, key: str) -> bool:
        """Check if key exists"""
        if self.available:
            return bool(self.client.exists(key))
        return key in self.memory_cache
    
    def get_with_metadata(self, key: str) -> Optional[dict]:
        """Get value with metadata (TTL, size, etc)"""
        if not self.available:
            value = self.memory_cache.get(key)
            return {'value': value, 'ttl': -1, 'size': len(str(value))} if value else None
        
        try:
            value = self.get(key)
            if value is None:
                return None
            
            ttl = self.client.ttl(key)
            size = len(pickle.dumps(value))
            
            return {
                'value': value,
                'ttl': ttl,
                'size': size,
                'cached_at': datetime.now().isoformat()
            }
        except Exception as e:
            print(f"Error getting metadata: {e}")
            return None
    
    def _increment_stat(self, stat_name: str):
        """Increment cache statistics"""
        if not self.available:
            return
        
        try:
            stats_str = self.client.get('cache:stats')
            if stats_str:
                stats = json.loads(stats_str)
            else:
                stats = {'hits': 0, 'misses': 0, 'total_size': 0, 'evictions': 0}
            
            stats[stat_name] = stats.get(stat_name, 0) + 1
            self.client.set('cache:stats', json.dumps(stats))
        except Exception as e:
            print(f"Error updating stats: {e}")
    
    def get_stats(self) -> dict:
        """Get cache statistics"""
        if not self.available:
            return {
                'available': False,
                'hits': 0,
                'misses': 0,
                'hit_rate': 0.0,
                'total_size': len(self.memory_cache),
                'evictions': 0
            }
        
        try:
            stats_str = self.client.get('cache:stats')
            if stats_str:
                stats = json.loads(stats_str)
            else:
                stats = {'hits': 0, 'misses': 0, 'total_size': 0, 'evictions': 0}
            
            total = stats['hits'] + stats['misses']
            hit_rate = stats['hits'] / total if total > 0 else 0.0
            
            return {
                'available': True,
                'hits': stats['hits'],
                'misses': stats['misses'],
                'hit_rate': round(hit_rate, 3),
                'total_size': stats.get('total_size', 0),
                'evictions': stats.get('evictions', 0)
            }
        except Exception as e:
            print(f"Error getting stats: {e}")
            return {'available': True, 'error': str(e)}
    
    def clear_pattern(self, pattern: str) -> int:
        """Clear all keys matching pattern"""
        if not self.available:
            count = 0
            keys_to_delete = [k for k in self.memory_cache.keys() if pattern in k]
            for key in keys_to_delete:
                del self.memory_cache[key]
                count += 1
            return count
        
        try:
            keys = self.client.keys(pattern)
            if keys:
                self.client.delete(*keys)
                return len(keys)
            return 0
        except Exception as e:
            print(f"Error clearing pattern: {e}")
            return 0
    
    def cache_llm_response(self, prompt: str, response: str, ttl: Optional[int] = None):
        """Cache LLM response with special handling"""
        ttl = ttl or settings.CACHE_LLM_RESPONSE_TTL
        key = self._generate_key("llm", prompt)
        
        cache_data = {
            'response': response,
            'cached_at': datetime.now().isoformat(),
            'prompt_hash': key
        }
        
        return self.set(key, cache_data, ttl)
    
    def get_llm_response(self, prompt: str) -> Optional[str]:
        """Get cached LLM response"""
        key = self._generate_key("llm", prompt)
        data = self.get(key)
        
        if data and isinstance(data, dict):
            return data.get('response')
        return None
    
    def cache_oracle_query(self, sql: str, params: dict, result: Any, ttl: Optional[int] = None):
        """Cache Oracle query result"""
        ttl = ttl or settings.CACHE_ORACLE_QUERY_TTL
        
        query_data = {'sql': sql, 'params': params}
        key = self._generate_key("oracle", query_data)
        
        cache_data = {
            'result': result,
            'cached_at': datetime.now().isoformat(),
            'query_hash': key
        }
        
        return self.set(key, cache_data, ttl)
    
    def get_oracle_query(self, sql: str, params: dict) -> Optional[Any]:
        """Get cached Oracle query result"""
        query_data = {'sql': sql, 'params': params}
        key = self._generate_key("oracle", query_data)
        data = self.get(key)
        
        if data and isinstance(data, dict):
            return data.get('result')
        return None
    
    def cache_workflow_state(self, workflow_id: str, state: dict, ttl: Optional[int] = None):
        """Cache workflow execution state"""
        ttl = ttl or settings.CACHE_WORKFLOW_STATE_TTL
        key = f"workflow:{workflow_id}:state"
        return self.set(key, state, ttl)
    
    def get_workflow_state(self, workflow_id: str) -> Optional[dict]:
        """Get cached workflow state"""
        key = f"workflow:{workflow_id}:state"
        return self.get(key)

# Global cache instance
cache = RedisCache()
