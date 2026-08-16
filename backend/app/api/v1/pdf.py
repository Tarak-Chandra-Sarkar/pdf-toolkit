import logging
from typing import List

from fastapi import (
    APIRouter,
    File,
    Form,
    UploadFile,
    HTTPException,
)

from app.core.config import settings
from app.models.pdf import PdfInfoResponse
from app.services.pdf_service import pdf_service
from app.services.page_management_service import (
    delete_pages,
    reorder_pages,
    rotate_pages,
)

from fastapi.responses import (
    FileResponse,
    Response,
    StreamingResponse,
)

from io import BytesIO

logger = logging.getLogger(__name__)


router = APIRouter(
    prefix="/pdf",
    tags=["PDF"],
)


@router.post(
    "/upload",
    response_model=PdfInfoResponse,
)
async def upload_pdf(
    file: UploadFile = File(...),
) -> PdfInfoResponse:

    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="A filename is required.",
        )

    filename = file.filename

    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    file_id = pdf_service.create_file_id()

    pdf_path = pdf_service.get_pdf_path(
        file_id
    )

    max_bytes = (
        settings.max_upload_size_mb
        * 1024
        * 1024
    )

    try:

        total_bytes = 0

        with pdf_path.open("wb") as output:

            while True:

                chunk = await file.read(
                    1024 * 1024
                )

                if not chunk:
                    break

                total_bytes += len(chunk)

                if total_bytes > max_bytes:

                    raise HTTPException(
                        status_code=413,
                        detail=(
                            "The PDF exceeds the "
                            f"{settings.max_upload_size_mb} MB "
                            "upload limit."
                        ),
                    )

                output.write(chunk)

        pdf_service.validate_pdf(
            pdf_path
        )

        return pdf_service.inspect(
            file_id=file_id,
            filename=filename,
        )

    except HTTPException:

        pdf_service.delete_file(
            file_id
        )

        raise

    except ValueError as exc:

        pdf_service.delete_file(
            file_id
        )

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        logger.exception(
            "Unexpected PDF upload failure."
        )

        pdf_service.delete_file(
            file_id
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to process the PDF.",
        ) from exc

    finally:

        await file.close()

@router.post("/merge")
async def merge_pdf_files(
    files: List[UploadFile] = File(...),
):
    if len(files) < 2:
        raise HTTPException(
            status_code=400,
            detail="At least two PDF files are required.",
        )

    input_files: list[tuple[str, bytes]] = []

    for file in files:
        if not file.filename:
            raise HTTPException(
                status_code=400,
                detail="Uploaded file must have a filename.",
            )

        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(
                status_code=400,
                detail=f"{file.filename} is not a PDF.",
            )

        content = await file.read()

        if not content:
            raise HTTPException(
                status_code=400,
                detail=f"{file.filename} is empty.",
            )

        input_files.append(
            (file.filename, content)
        )

    try:
        return pdf_service.merge_pdfs(
            input_files
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail="Unable to merge PDFs.",
        ) from exc

    finally:
        for file in files:
            await file.close()

@router.post("/split")
async def split_pdf_file(
    file: UploadFile = File(...),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="PDF file must have a filename.",
        )

    if not file.filename.lower().endswith(
        ".pdf"
    ):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="PDF file is empty.",
        )

    try:

        (
            zip_content,
            output_filename,
            page_count,
        ) = pdf_service.split_pdf(
            content,
            file.filename,
        )

        return StreamingResponse(
            BytesIO(zip_content),
            media_type="application/zip",
            headers={
                "Content-Disposition": (
                    f'attachment; '
                    f'filename="{output_filename}"'
                ),
                "X-Page-Count": str(
                    page_count
                ),
            },
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        logger.exception(
            "PDF split failed."
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to split PDF.",
        ) from exc

    finally:

        await file.close()

@router.post("/extract")
async def extract_page_range(
    file: UploadFile = File(...),
    start_page: int = Form(...),
    end_page: int = Form(...),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="PDF file must have a filename.",
        )

    if not file.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=400,
            detail="Only PDF files are supported.",
        )

    content = await file.read()

    if not content:
        raise HTTPException(
            status_code=400,
            detail="PDF file is empty.",
        )

    try:
        (
            pdf_content,
            output_filename,
            page_count,
        ) = pdf_service.extract_page_range(
            content=content,
            filename=file.filename,
            start_page=start_page,
            end_page=end_page,
        )

        return StreamingResponse(
            BytesIO(pdf_content),
            media_type="application/pdf",
            headers={
                "Content-Disposition": (
                    f'attachment; '
                    f'filename="{output_filename}"'
                ),
                "X-Page-Count": str(
                    page_count
                ),
            },
        )

    except ValueError as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:
        logger.exception(
            "PDF page extraction failed."
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to extract PDF pages.",
        ) from exc

    finally:
        await file.close()

@router.get(
    "/{file_id}/pages/{page_number}/preview"
)
async def preview_pdf_page(
    file_id: str,
    page_number: int,
) -> Response:

    try:

        image = pdf_service.render_page(
            file_id=file_id,
            page_number=page_number,
        )

        return Response(
            content=image,
            media_type="image/png",
            headers={
                "Cache-Control": "no-store",
            },
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=404,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        logger.exception(
            "Unable to render PDF page."
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to render PDF page.",
        ) from exc

@router.get(
    "/{file_id}/download",
)
async def download_pdf(
    file_id: str,
) -> FileResponse:

    pdf_path = pdf_service.get_pdf_path(
        file_id
    )

    if not pdf_path.exists():
        raise HTTPException(
            status_code=404,
            detail="PDF not found.",
        )

    return FileResponse(
        path=pdf_path,
        media_type="application/pdf",
        filename="merged.pdf",
    )

@router.delete(
    "/{file_id}",
)
async def delete_pdf(
    file_id: str,
) -> dict[str, str]:

    pdf_path = pdf_service.get_pdf_path(
        file_id
    )

    if not pdf_path.exists():

        raise HTTPException(
            status_code=404,
            detail="PDF not found.",
        )

    pdf_service.delete_file(
        file_id
    )

    return {
        "status": "deleted",
        "file_id": file_id,
    }

@router.post(
    "/from-images",
    summary="Convert Images To PDF",
)
async def convert_images_to_pdf(
    files: List[UploadFile] = File(...),
):
    """
    Convert multiple JPG/JPEG/PNG images into
    a single PDF.

    Image order is preserved.
    """

    try:

        output_path = (
            await pdf_service.images_to_pdf(
                files
            )
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail="Unable to create PDF from images.",
        ) from exc


    return FileResponse(
        path=output_path,
        media_type="application/pdf",
        filename="images_to_pdf.pdf",
    )

@router.post(
    "/pages/delete",
)
async def delete_pdf_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),
):

    input_path = (
        settings.temp_dir
        / f"page_delete_{file.filename}"
    )

    try:

        contents = await file.read()

        input_path.write_bytes(
            contents
        )

        try:
            page_numbers = [
                int(value.strip())
                for value in pages.split(",")
                if value.strip()
            ]

        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Pages must be a comma-separated "
                    "list of integers."
                ),
            ) from exc

        output_path = delete_pages(
            input_path=input_path,
            output_dir=settings.output_dir,
            pages=page_numbers,
        )

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="modified.pdf",
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to delete PDF pages."
            ),
        ) from exc

    finally:

        input_path.unlink(
            missing_ok=True
        )

@router.post(
    "/pages/delete",
)
async def delete_pdf_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),
):

    input_path = (
        settings.temp_dir
        / f"page_delete_{file.filename}"
    )

    try:

        contents = await file.read()

        input_path.write_bytes(
            contents
        )

        try:
            page_numbers = [
                int(value.strip())
                for value in pages.split(",")
                if value.strip()
            ]

        except ValueError as exc:
            raise HTTPException(
                status_code=400,
                detail=(
                    "Pages must be a comma-separated "
                    "list of integers."
                ),
            ) from exc

        output_path = delete_pages(
            input_path=input_path,
            output_dir=settings.output_dir,
            pages=page_numbers,
        )

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="modified.pdf",
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to delete PDF pages."
            ),
        ) from exc

    finally:

        input_path.unlink(
            missing_ok=True
        )

@router.post(
    "/pages/reorder",
)
async def reorder_pdf_pages(
    file: UploadFile = File(...),
    order: str = Form(...),
):

    input_path = (
        settings.temp_dir
        / f"page_reorder_{file.filename}"
    )

    try:

        contents = await file.read()

        input_path.write_bytes(
            contents
        )

        try:
            page_order = [
                int(value.strip())
                for value in order.split(",")
                if value.strip()
            ]

        except ValueError as exc:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Order must be a comma-separated "
                    "list of integers."
                ),
            ) from exc

        output_path = reorder_pages(
            input_path=input_path,
            output_dir=settings.output_dir,
            order=page_order,
        )

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="reordered.pdf",
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to reorder PDF pages."
            ),
        ) from exc

    finally:

        input_path.unlink(
            missing_ok=True
        )

@router.post(
    "/pages/rotate",
)
async def rotate_pdf_pages(
    file: UploadFile = File(...),
    pages: str = Form(...),
    rotation: int = Form(...),
):

    input_path = (
        settings.temp_dir
        / f"page_rotate_{file.filename}"
    )

    try:

        contents = await file.read()

        input_path.write_bytes(
            contents
        )

        try:

            page_numbers = [
                int(value.strip())
                for value in pages.split(",")
                if value.strip()
            ]

        except ValueError as exc:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Pages must be a comma-separated "
                    "list of integers."
                ),
            ) from exc

        output_path = rotate_pages(
            input_path=input_path,
            output_dir=settings.output_dir,
            pages=page_numbers,
            rotation=rotation,
        )

        return FileResponse(
            path=output_path,
            media_type="application/pdf",
            filename="rotated.pdf",
        )

    except ValueError as exc:

        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc

    except HTTPException:
        raise

    except Exception as exc:

        raise HTTPException(
            status_code=500,
            detail=(
                "Unable to rotate PDF pages."
            ),
        ) from exc

    finally:

        input_path.unlink(
            missing_ok=True
        )