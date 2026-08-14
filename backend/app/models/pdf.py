from pydantic import BaseModel, Field


class PdfMetadata(BaseModel):
    title: str | None = None
    author: str | None = None
    subject: str | None = None
    creator: str | None = None
    producer: str | None = None


class PdfInfoResponse(BaseModel):
    file_id: str
    filename: str
    size_bytes: int
    page_count: int
    metadata: PdfMetadata


class PdfPageResponse(BaseModel):
    page_number: int = Field(ge=1)
    width: float
    height: float