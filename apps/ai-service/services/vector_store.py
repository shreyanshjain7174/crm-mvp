"""
Vector Store Service - Manages embeddings and similarity search for RAG
"""

import asyncio
import logging
from typing import Dict, Any, List, Optional
from datetime import datetime
import json

from core.config import settings

# Vector DB imports
try:
    import chromadb
    from chromadb.config import Settings as ChromaSettings
    CHROMA_AVAILABLE = True
except ImportError:
    CHROMA_AVAILABLE = False

try:
    import pinecone
    PINECONE_AVAILABLE = True
except ImportError:
    PINECONE_AVAILABLE = False

# Embedding imports
try:
    from sentence_transformers import SentenceTransformer
    SENTENCE_TRANSFORMERS_AVAILABLE = True
except ImportError:
    SENTENCE_TRANSFORMERS_AVAILABLE = False

logger = logging.getLogger(__name__)

class VectorStore:
    """
    Vector store service with local Chroma primary and Pinecone fallback
    """
    
    def __init__(self):
        self.chroma_client = None
        self.chroma_collection = None
        self.pinecone_index = None
        self.embedding_model = None
        
        # Initialize components
        self._init_embedding_model()
        self._init_chroma()
        self._init_pinecone()
    
    def _init_embedding_model(self):
        """Initialize local embedding model"""
        if SENTENCE_TRANSFORMERS_AVAILABLE:
            try:
                self.embedding_model = SentenceTransformer(settings.EMBEDDING_MODEL)
                logger.info(f"Embedding model loaded: {settings.EMBEDDING_MODEL}")
            except Exception as e:
                logger.error(f"Failed to load embedding model: {str(e)}")
    
    def _init_chroma(self):
        """Initialize Chroma vector database"""
        if not CHROMA_AVAILABLE or not settings.CHROMA_ENABLED:
            return
        
        try:
            # Configure Chroma client
            if settings.ENVIRONMENT == "production":
                # Use HTTP client for production (Docker)
                self.chroma_client = chromadb.HttpClient(
                    host=settings.CHROMA_HOST,
                    port=settings.CHROMA_PORT
                )
            else:
                # Use persistent client for development
                self.chroma_client = chromadb.PersistentClient(
                    path=settings.CHROMA_PERSIST_DIRECTORY
                )
            
            # Get or create collection
            self.chroma_collection = self.chroma_client.get_or_create_collection(
                name=settings.CHROMA_COLLECTION_NAME,
                metadata={"description": "CRM embeddings for RAG"}
            )
            
            logger.info(f"Chroma initialized with collection: {settings.CHROMA_COLLECTION_NAME}")
            
        except Exception as e:
            logger.error(f"Failed to initialize Chroma: {str(e)}")
            self.chroma_client = None
    
    def _init_pinecone(self):
        """Initialize Pinecone as fallback vector database"""
        if not PINECONE_AVAILABLE or not settings.PINECONE_API_KEY:
            return
        
        try:
            pinecone.init(
                api_key=settings.PINECONE_API_KEY,
                environment=settings.PINECONE_ENVIRONMENT
            )
            
            # Connect to existing index or create if needed
            if settings.PINECONE_INDEX_NAME in pinecone.list_indexes():
                self.pinecone_index = pinecone.Index(settings.PINECONE_INDEX_NAME)
                logger.info(f"Connected to Pinecone index: {settings.PINECONE_INDEX_NAME}")
            else:
                logger.warning(f"Pinecone index {settings.PINECONE_INDEX_NAME} not found")
                
        except Exception as e:
            logger.error(f"Failed to initialize Pinecone: {str(e)}")
    
    async def add_document(
        self, 
        document_id: str, 
        content: str, 
        metadata: Optional[Dict[str, Any]] = None
    ) -> bool:
        """Add document to vector store"""
        
        try:
            # Generate embedding
            embedding = await self._generate_embedding(content)
            if not embedding:
                return False
            
            # Prepare metadata
            doc_metadata = {
                "content": content,
                "timestamp": datetime.utcnow().isoformat(),
                **(metadata or {})
            }
            
            # Try Chroma first
            if self.chroma_collection:
                try:
                    self.chroma_collection.add(
                        ids=[document_id],
                        embeddings=[embedding],
                        metadatas=[doc_metadata],
                        documents=[content]
                    )
                    logger.info(f"Document added to Chroma: {document_id}")
                    return True
                except Exception as e:
                    logger.warning(f"Chroma add failed: {str(e)}")
            
            # Fallback to Pinecone
            if self.pinecone_index:
                try:
                    self.pinecone_index.upsert(
                        vectors=[(document_id, embedding, doc_metadata)]
                    )
                    logger.info(f"Document added to Pinecone: {document_id}")
                    return True
                except Exception as e:
                    logger.warning(f"Pinecone add failed: {str(e)}")
            
            return False
            
        except Exception as e:
            logger.error(f"Failed to add document {document_id}: {str(e)}")
            return False
    
    async def similarity_search(
        self, 
        query: str, 
        top_k: int = 5, 
        threshold: float = 0.7,
        filters: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Perform similarity search"""
        
        try:
            # Generate query embedding
            query_embedding = await self._generate_embedding(query)
            if not query_embedding:
                return []
            
            # Try Chroma first
            if self.chroma_collection:
                try:
                    results = self.chroma_collection.query(
                        query_embeddings=[query_embedding],
                        n_results=top_k,
                        where=filters
                    )
                    
                    formatted_results = []
                    for i, distance in enumerate(results.get("distances", [[]])[0]):
                        similarity = 1 - distance  # Convert distance to similarity
                        if similarity >= threshold:
                            formatted_results.append({
                                "id": results["ids"][0][i],
                                "content": results["documents"][0][i],
                                "metadata": results["metadatas"][0][i],
                                "similarity": similarity
                            })
                    
                    logger.info(f"Chroma search returned {len(formatted_results)} results")
                    return formatted_results
                    
                except Exception as e:
                    logger.warning(f"Chroma search failed: {str(e)}")
            
            # Fallback to Pinecone
            if self.pinecone_index:
                try:
                    results = self.pinecone_index.query(
                        vector=query_embedding,
                        top_k=top_k,
                        include_metadata=True,
                        filter=filters
                    )
                    
                    formatted_results = []
                    for match in results.get("matches", []):
                        if match["score"] >= threshold:
                            formatted_results.append({
                                "id": match["id"],
                                "content": match["metadata"].get("content", ""),
                                "metadata": match["metadata"],
                                "similarity": match["score"]
                            })
                    
                    logger.info(f"Pinecone search returned {len(formatted_results)} results")
                    return formatted_results
                    
                except Exception as e:
                    logger.warning(f"Pinecone search failed: {str(e)}")
            
            return []
            
        except Exception as e:
            logger.error(f"Similarity search failed: {str(e)}")
            return []
    
    async def delete_document(self, document_id: str) -> bool:
        """Delete document from vector store"""
        
        success = False
        
        # Try Chroma
        if self.chroma_collection:
            try:
                self.chroma_collection.delete(ids=[document_id])
                success = True
                logger.info(f"Document deleted from Chroma: {document_id}")
            except Exception as e:
                logger.warning(f"Chroma delete failed: {str(e)}")
        
        # Try Pinecone
        if self.pinecone_index:
            try:
                self.pinecone_index.delete(ids=[document_id])
                success = True
                logger.info(f"Document deleted from Pinecone: {document_id}")
            except Exception as e:
                logger.warning(f"Pinecone delete failed: {str(e)}")
        
        return success
    
    async def _generate_embedding(self, text: str) -> Optional[List[float]]:
        """Generate embedding for text"""
        
        if not self.embedding_model:
            logger.error("No embedding model available")
            return None
        
        try:
            # Run embedding generation in thread pool to avoid blocking
            embedding = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: self.embedding_model.encode(text).tolist()
            )
            return embedding
            
        except Exception as e:
            logger.error(f"Embedding generation failed: {str(e)}")
            return None
    
    async def add_crm_data(self, lead_data: Dict[str, Any]) -> bool:
        """Add CRM lead data to vector store for RAG"""
        
        try:
            lead_id = lead_data.get("id")
            if not lead_id:
                return False
            
            # Create searchable content from lead data
            content_parts = []
            
            if lead_data.get("name"):
                content_parts.append(f"Lead Name: {lead_data['name']}")
            
            if lead_data.get("company"):
                content_parts.append(f"Company: {lead_data['company']}")
            
            if lead_data.get("industry"):
                content_parts.append(f"Industry: {lead_data['industry']}")
            
            if lead_data.get("notes"):
                content_parts.append(f"Notes: {lead_data['notes']}")
            
            if lead_data.get("status"):
                content_parts.append(f"Status: {lead_data['status']}")
            
            # Include message history
            messages = lead_data.get("messages", [])
            if messages:
                recent_messages = messages[-5:]  # Last 5 messages
                message_content = []
                for msg in recent_messages:
                    direction = "Customer" if msg.get("direction") == "INBOUND" else "Agent"
                    message_content.append(f"{direction}: {msg.get('content', '')}")
                
                if message_content:
                    content_parts.append(f"Recent Messages: {' | '.join(message_content)}")
            
            content = " | ".join(content_parts)
            
            metadata = {
                "type": "lead",
                "lead_id": lead_id,
                "status": lead_data.get("status"),
                "source": lead_data.get("source"),
                "priority": lead_data.get("priority"),
                "last_contact": lead_data.get("last_contact_date")
            }
            
            return await self.add_document(f"lead_{lead_id}", content, metadata)
            
        except Exception as e:
            logger.error(f"Failed to add CRM data: {str(e)}")
            return False
    
    async def health_check(self) -> Dict[str, Any]:
        """Check vector store health"""
        
        health = {
            "timestamp": datetime.utcnow().isoformat(),
            "embedding_model": bool(self.embedding_model),
            "chroma": {"available": False, "collection_count": 0},
            "pinecone": {"available": False, "index_stats": {}}
        }
        
        # Check Chroma
        if self.chroma_collection:
            try:
                count = self.chroma_collection.count()
                health["chroma"] = {
                    "available": True,
                    "collection_count": count,
                    "collection_name": settings.CHROMA_COLLECTION_NAME
                }
            except Exception as e:
                logger.warning(f"Chroma health check failed: {str(e)}")
        
        # Check Pinecone
        if self.pinecone_index:
            try:
                stats = self.pinecone_index.describe_index_stats()
                health["pinecone"] = {
                    "available": True,
                    "index_stats": stats
                }
            except Exception as e:
                logger.warning(f"Pinecone health check failed: {str(e)}")
        
        return health