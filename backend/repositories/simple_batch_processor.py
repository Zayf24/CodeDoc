# Batch processor for managing API rate limits and token constraints
import time
import logging

logger = logging.getLogger(__name__)

class SimpleBatchProcessor:
    def __init__(self, max_tokens_per_batch=40000, max_requests_per_minute=12):
        self.max_tokens = max_tokens_per_batch
        self.max_rpm = max_requests_per_minute
        self.current_batch = []
        self.current_tokens = 0
        self.requests_made = 0
        self.start_time = time.time()

    def count_tokens(self, text):
        """
        Estimate token count for text content.
        
        Uses a conservative estimation of 3.5 characters per token,
        which is appropriate for most natural language content.
        This method provides a quick approximation without requiring
        the actual tokenizer, making it suitable for batch processing
        where speed is important.
        """
        return len(str(text)) // 3.5

    def add_file(self, file_data):
        """
        Add a file to the current batch for processing.
        
        This method implements intelligent batch management:
        1. Calculates token count for the new file
        2. Checks if adding it would exceed token limits
        3. If limit exceeded, signals that current batch should be processed
        4. Otherwise, adds file to current batch and updates token count
        
        Returns True if batch should be processed, False otherwise.
        This allows the caller to decide when to process batches.
        """
        content = file_data.get('content', '')
        tokens = self.count_tokens(content)
        
        # Check if adding this file would exceed token limits
        if self.current_tokens + tokens > self.max_tokens and self.current_batch:
            logger.info(f"Token limit reached ({self.current_tokens + tokens}), processing current batch")
            return True  # Signal that batch should be processed
        
        # Add file to current batch and update token count
        self.current_batch.append(file_data)
        self.current_tokens += tokens
        
        logger.debug(f"Added file to batch. Total: {len(self.current_batch)} files, {self.current_tokens} tokens")
        return False

    def _wait_if_rate_limited(self):
        """
        Wait if we've hit the API rate limit.
        
        This method implements intelligent rate limiting:
        1. Calculates time elapsed since last reset
        2. If rate limit exceeded, waits for remaining time + buffer
        3. Resets tracking counters after waiting
        4. Adds 5-second buffer to ensure compliance
        
        The buffer prevents edge cases where we might hit the limit
        immediately after waiting.
        """
        elapsed = time.time() - self.start_time
        
        if self.requests_made >= self.max_rpm:
            if elapsed < 60:
                wait_time = 60 - elapsed + 5  # Add 5 second buffer
                logger.info(f"Rate limit reached. Waiting {wait_time:.1f} seconds...")
                time.sleep(wait_time)
            
            # Reset tracking counters after rate limit period
            self.start_time = time.time()
            self.requests_made = 0

    def _reset_batch(self):
        """Reset current batch"""
        self.current_batch = []
        self.current_tokens = 0
        
    def get_batch_info(self):
        """Get current batch information"""
        return {
            'files': len(self.current_batch),
            'tokens': self.current_tokens,
            'requests_made': self.requests_made
        }
