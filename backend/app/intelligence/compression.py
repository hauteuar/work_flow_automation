import re
import hashlib
from typing import List, Tuple
from datetime import datetime
from config import settings
from cache.redis_cache import cache

class BloatingCompressionEngine:
    """
    Intelligent compression engine to reduce token usage while preserving semantics
    
    Techniques:
    1. Semantic deduplication - Remove redundant information
    2. Sentence compression - Condense verbose sentences
    3. Smart summarization - Use LLM for critical compression
    4. Context windowing - Keep only relevant context
    """
    
    def __init__(self):
        self.stats = {
            'total_compressions': 0,
            'total_tokens_saved': 0,
            'average_ratio': 0.0
        }
    
    async def compress_context(self, 
                               context: str, 
                               max_tokens: int = None,
                               preserve_structure: bool = False) -> Tuple[str, dict]:
        """
        Compress context intelligently
        
        Args:
            context: Original text to compress
            max_tokens: Maximum tokens allowed (uses config default if None)
            preserve_structure: Whether to maintain original structure
            
        Returns:
            Tuple of (compressed_text, metadata)
        """
        max_tokens = max_tokens or settings.MAX_CONTEXT_TOKENS
        
        # Check cache first
        cache_key = self._generate_cache_key(context, max_tokens)
        cached = cache.get(cache_key)
        if cached:
            return cached['compressed'], {**cached['metadata'], 'cached': True}
        
        start_time = datetime.now()
        original_tokens = self._estimate_tokens(context)
        
        # If already within limit, return as-is
        if original_tokens <= max_tokens:
            return context, {
                'original_tokens': original_tokens,
                'compressed_tokens': original_tokens,
                'ratio': 1.0,
                'technique': 'none',
                'time_ms': 0
            }
        
        # Apply compression techniques
        compressed = context
        technique_used = []
        
        # Step 1: Remove redundancy
        if not preserve_structure:
            compressed = self._remove_redundancy(compressed)
            technique_used.append('redundancy_removal')
        
        # Step 2: Semantic deduplication
        compressed = self._semantic_dedup(compressed)
        technique_used.append('semantic_dedup')
        
        # Step 3: Sentence compression
        if self._estimate_tokens(compressed) > max_tokens:
            compressed = self._compress_sentences(compressed)
            technique_used.append('sentence_compression')
        
        # Step 4: If still too large, aggressive summarization
        if self._estimate_tokens(compressed) > max_tokens:
            compressed = self._aggressive_compress(compressed, max_tokens)
            technique_used.append('aggressive_summary')
        
        # Calculate stats
        compressed_tokens = self._estimate_tokens(compressed)
        ratio = compressed_tokens / original_tokens if original_tokens > 0 else 1.0
        time_ms = (datetime.now() - start_time).total_seconds() * 1000
        
        metadata = {
            'original_tokens': original_tokens,
            'compressed_tokens': compressed_tokens,
            'ratio': round(ratio, 3),
            'tokens_saved': original_tokens - compressed_tokens,
            'technique': ', '.join(technique_used),
            'time_ms': round(time_ms, 2),
            'cached': False
        }
        
        # Update stats
        self._update_stats(original_tokens, compressed_tokens, ratio)
        
        # Cache result
        cache.set(cache_key, {
            'compressed': compressed,
            'metadata': metadata
        }, ttl=3600)
        
        print(f"💾 Compressed: {original_tokens}→{compressed_tokens} tokens "
              f"({(1-ratio)*100:.1f}% saved, {time_ms:.1f}ms)")
        
        return compressed, metadata
    
    def _remove_redundancy(self, text: str) -> str:
        """Remove redundant phrases and filler words"""
        # Common redundant patterns
        patterns = [
            (r'\s+', ' '),  # Multiple spaces
            (r'(\w+)\s+\1', r'\1'),  # Repeated words
            (r'very\s+', ''),  # Filler words
            (r'really\s+', ''),
            (r'actually\s+', ''),
            (r'basically\s+', ''),
            (r'\s*,\s*,\s*', ', '),  # Multiple commas
            (r'\s*\.\s*\.\s*', '. '),  # Multiple periods
        ]
        
        compressed = text
        for pattern, replacement in patterns:
            compressed = re.sub(pattern, replacement, compressed)
        
        return compressed.strip()
    
    def _semantic_dedup(self, text: str) -> str:
        """Remove semantically similar sentences"""
        sentences = self._split_sentences(text)
        
        if len(sentences) <= 2:
            return text
        
        unique_sentences = []
        seen_signatures = set()
        
        for sentence in sentences:
            signature = self._sentence_signature(sentence)
            
            # Keep if unique signature
            if signature not in seen_signatures:
                seen_signatures.add(signature)
                unique_sentences.append(sentence)
        
        return ' '.join(unique_sentences)
    
    def _sentence_signature(self, sentence: str) -> str:
        """
        Create semantic signature of sentence
        Uses key words (nouns, important terms) to identify similarity
        """
        # Normalize
        normalized = sentence.lower().strip()
        
        # Remove common words
        stop_words = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 
                      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
                      'would', 'could', 'should', 'may', 'might', 'can', 'to', 'of',
                      'in', 'on', 'at', 'for', 'with', 'from', 'by', 'about', 'as'}
        
        words = normalized.split()
        key_words = [w for w in words if w not in stop_words and len(w) > 3]
        
        # Sort and join to create signature
        key_words = sorted(key_words)[:5]  # Top 5 key words
        
        return '-'.join(key_words)
    
    def _compress_sentences(self, text: str) -> str:
        """Compress individual sentences by removing non-essential parts"""
        sentences = self._split_sentences(text)
        compressed_sentences = []
        
        for sentence in sentences:
            # Remove parenthetical expressions
            compressed = re.sub(r'\([^)]*\)', '', sentence)
            
            # Remove relative clauses (simplified)
            compressed = re.sub(r',\s*which\s+[^,]*,', ',', compressed)
            compressed = re.sub(r',\s*who\s+[^,]*,', ',', compressed)
            
            # Remove adverbs (ending in -ly)
            compressed = re.sub(r'\s+\w+ly\s+', ' ', compressed)
            
            # Clean up
            compressed = re.sub(r'\s+', ' ', compressed).strip()
            
            if compressed:
                compressed_sentences.append(compressed)
        
        return ' '.join(compressed_sentences)
    
    def _aggressive_compress(self, text: str, max_tokens: int) -> str:
        """
        Aggressively compress text to fit within token limit
        Keeps first and last sentences, summarizes middle
        """
        sentences = self._split_sentences(text)
        
        if len(sentences) <= 3:
            # Already minimal, just truncate
            return self._truncate_to_tokens(text, max_tokens)
        
        # Keep first sentence (context)
        first = sentences[0]
        # Keep last sentence (conclusion)
        last = sentences[-1]
        
        # Middle sentences - extract key facts
        middle = sentences[1:-1]
        key_facts = []
        
        for sent in middle:
            # Look for sentences with numbers, dates, or specific data
            if re.search(r'\d+', sent) or any(word in sent.lower() for word in 
                                              ['failed', 'error', 'success', 'completed']):
                key_facts.append(sent)
        
        # Combine
        if key_facts:
            compressed = f"{first} {' '.join(key_facts[:2])} {last}"
        else:
            compressed = f"{first} {last}"
        
        # Final truncation if still too large
        if self._estimate_tokens(compressed) > max_tokens:
            compressed = self._truncate_to_tokens(compressed, max_tokens)
        
        return compressed
    
    def _split_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Simple sentence splitting (can be enhanced with nltk)
        sentences = re.split(r'[.!?]+', text)
        return [s.strip() for s in sentences if s.strip()]
    
    def _truncate_to_tokens(self, text: str, max_tokens: int) -> str:
        """Truncate text to approximately max_tokens"""
        # Rough estimate: 1 token ≈ 4 characters
        max_chars = max_tokens * 4
        
        if len(text) <= max_chars:
            return text
        
        # Truncate at sentence boundary if possible
        truncated = text[:max_chars]
        last_period = truncated.rfind('.')
        
        if last_period > max_chars * 0.8:  # If within 80% of target
            return truncated[:last_period + 1]
        
        return truncated + "..."
    
    def _estimate_tokens(self, text: str) -> int:
        """
        Estimate token count
        Rough approximation: 1 token ≈ 4 characters
        More accurate would use tiktoken library
        """
        if not text:
            return 0
        
        # Simple estimation
        return len(text) // 4
    
    def _generate_cache_key(self, context: str, max_tokens: int) -> str:
        """Generate cache key for compression"""
        content = f"{context}:{max_tokens}"
        hash_obj = hashlib.sha256(content.encode())
        return f"compress:{hash_obj.hexdigest()[:16]}"
    
    def _update_stats(self, original: int, compressed: int, ratio: float):
        """Update compression statistics"""
        self.stats['total_compressions'] += 1
        self.stats['total_tokens_saved'] += (original - compressed)
        
        # Running average
        n = self.stats['total_compressions']
        current_avg = self.stats['average_ratio']
        self.stats['average_ratio'] = (current_avg * (n - 1) + ratio) / n
    
    def get_stats(self) -> dict:
        """Get compression statistics"""
        return {
            **self.stats,
            'average_ratio': round(self.stats['average_ratio'], 3),
            'average_savings_pct': round((1 - self.stats['average_ratio']) * 100, 1)
        }

# Global compression engine instance
compression_engine = BloatingCompressionEngine()
