from pydantic import BaseModel
from typing import List

class PreprocessResult(BaseModel):
    document_id: str
    cleaned_paths: List[str]
    page_count: int
    quality_score: float
    warnings: List[str]
    success: bool
