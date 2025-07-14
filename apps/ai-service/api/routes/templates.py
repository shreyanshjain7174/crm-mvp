"""
Templates API routes
"""

from fastapi import APIRouter

router = APIRouter()

@router.get("/")
async def root():
    return {"message": "templates endpoint"}
