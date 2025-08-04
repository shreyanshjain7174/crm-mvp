"""
Logger configuration for AI backend service
"""

import logging
import os
import sys
from logging.handlers import RotatingFileHandler
from datetime import datetime

def setup_logger(name: str) -> logging.Logger:
    """Setup logger with consistent formatting"""
    
    logger = logging.getLogger(name)
    
    # Don't setup multiple handlers for the same logger
    if logger.handlers:
        return logger
    
    # Set log level from environment
    log_level = os.getenv("AI_BACKEND_LOG_LEVEL", "INFO").upper()
    logger.setLevel(getattr(logging, log_level, logging.INFO))
    
    # Create formatter
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler (optional)
    log_file = os.getenv("AI_BACKEND_LOG_FILE")
    if log_file:
        try:
            # Create log directory if it doesn't exist
            log_dir = os.path.dirname(log_file)
            if log_dir and not os.path.exists(log_dir):
                os.makedirs(log_dir)
            
            file_handler = RotatingFileHandler(
                log_file,
                maxBytes=10 * 1024 * 1024,  # 10MB
                backupCount=5
            )
            file_handler.setFormatter(formatter)
            logger.addHandler(file_handler)
            
        except Exception as e:
            logger.warning(f"Could not setup file logging: {e}")
    
    # Prevent propagation to root logger
    logger.propagate = False
    
    return logger

def get_logger(name: str) -> logging.Logger:
    """Get existing logger or create new one"""
    return logging.getLogger(name) or setup_logger(name)