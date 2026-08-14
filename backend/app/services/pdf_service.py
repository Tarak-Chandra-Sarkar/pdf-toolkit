import logging
import uuid

from pathlib import Path

import pymupdf

from app.core.config import settings
from app.models.pdf import (
    PdfInfoResponse,
    PdfMetadata,
)

from pypdf import PdfReader, PdfWriter

from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

logger = logging.getLogger(__name__)


class PdfService:

    def __init__(self) -> None:
        self.base_directory = Path(
            settings.upload_directory
        )

        self.base_directory.mkdir(
            parents=True,
            exist_ok=True,
        )

    def create_file_id(self) -> str:
        return uuid.uuid4().hex

    def get_file_directory(
        self,
        file_id: str,
    ) -> Path:

        directory = (
            self.base_directory / file_id
        )

        directory.mkdir(
            parents=True,
            exist_ok=True,
        )

        return directory

    def get_pdf_path(
        self,
        file_id: str,
    ) -> Path:

        return (
            self.get_file_directory(file_id)
            / "document.pdf"
        )

    def validate_pdf(
        self,
        file_path: Path,
    ) -> None:

        if not file_path.exists():
            raise FileNotFoundError(
                "PDF file does not exist."
            )

        if file_path.stat().st_size == 0:
            raise ValueError(
                "The uploaded PDF is empty."
            )

        try:
            with pymupdf.open(file_path) as document:

                if document.page_count == 0:
                    raise ValueError(
                        "The PDF contains no pages."
                    )

        except ValueError:
            raise

        except Exception as exc:

            logger.exception(
                "PDF validation failed."
            )

            raise ValueError(
                "The uploaded file is not a valid PDF."
            ) from exc

    def inspect(
        self,
        file_id: str,
        filename: str,
    ) -> PdfInfoResponse:

        pdf_path = self.get_pdf_path(
            file_id
        )

        self.validate_pdf(pdf_path)

        with pymupdf.open(pdf_path) as document:

            metadata = document.metadata

            return PdfInfoResponse(
                file_id=file_id,
                filename=filename,
                size_bytes=pdf_path.stat().st_size,
                page_count=document.page_count,
                metadata=PdfMetadata(
                    title=metadata.get("title") or None,
                    author=metadata.get("author") or None,
                    subject=metadata.get("subject") or None,
                    creator=metadata.get("creator") or None,
                    producer=metadata.get("producer") or None,
                ),
            )

    def render_page(
        self,
        file_id: str,
        page_number: int,
        dpi: int | None = None,
    ) -> bytes:

        pdf_path = self.get_pdf_path(
            file_id
        )

        self.validate_pdf(pdf_path)

        render_dpi = (
            dpi or settings.preview_dpi
        )

        with pymupdf.open(pdf_path) as document:

            if page_number < 1:
                raise ValueError(
                    "Page number must be at least 1."
                )

            if page_number > document.page_count:
                raise ValueError(
                    "Requested page does not exist."
                )

            page = document.load_page(
                page_number - 1
            )

            matrix = pymupdf.Matrix(
                render_dpi / 72,
                render_dpi / 72,
            )

            pixmap = page.get_pixmap(
                matrix=matrix,
                alpha=False,
            )

            return pixmap.tobytes("png")

    def delete_file(
        self,
        file_id: str,
    ) -> None:

        directory = (
            self.base_directory / file_id
        )

        if not directory.exists():
            return

        for path in directory.iterdir():

            if path.is_file():
                path.unlink()

        directory.rmdir()

        logger.info(
            "Deleted PDF directory: %s",
            file_id,
        )

    def merge_pdfs(
    self,
    input_files: list[tuple[str, bytes]],
    ) -> PdfInfoResponse:

        if not input_files:
            raise ValueError(
                "At least one PDF is required."
            )

        file_id = self.create_file_id()

        output_path = self.get_pdf_path(
            file_id
        )

        temporary_files: list[Path] = []

        try:
            writer = PdfWriter()

            for filename, content in input_files:

                if not filename.lower().endswith(
                    ".pdf"
                ):
                    raise ValueError(
                        f"{filename} is not a PDF file."
                    )

                temp_path = (
                    self.get_file_directory(file_id)
                    / filename
                )

                temp_path.write_bytes(content)

                temporary_files.append(
                    temp_path
                )

                try:
                    writer.append(
                        str(temp_path)
                    )
                except Exception as exc:
                    raise ValueError(
                        f"Unable to read PDF: {filename}"
                    ) from exc

            with output_path.open(
                "wb"
            ) as output:

                writer.write(output)

            writer.close()

            return self.inspect(
                file_id=file_id,
                filename="merged.pdf",
            )

        except Exception:
            self.delete_file(file_id)
            raise

    def split_pdf(
    self,
    content: bytes,
    filename: str,
    ) -> tuple[bytes, str, int]:
        """
        Split a PDF into individual page PDFs.

        Returns:
            zip_content,
            output_filename,
            page_count
        """

        if not content:
            raise ValueError("PDF file is empty.")

        try:
            reader = PdfReader(
                BytesIO(content)
            )
        except Exception as exc:
            raise ValueError(
                f"Unable to read PDF file: {exc}"
            ) from exc

        page_count = len(reader.pages)

        if page_count == 0:
            raise ValueError(
                "PDF contains no pages."
            )

        zip_buffer = BytesIO()

        with ZipFile(
            zip_buffer,
            mode="w",
            compression=ZIP_DEFLATED,
        ) as archive:

            for index, page in enumerate(
                reader.pages,
                start=1,
            ):

                writer = PdfWriter()

                writer.add_page(page)

                pdf_buffer = BytesIO()

                writer.write(pdf_buffer)

                archive.writestr(
                    f"page_{index:03d}.pdf",
                    pdf_buffer.getvalue(),
                )

        return (
            zip_buffer.getvalue(),
            "split_pdf.zip",
            page_count,
        )

    def extract_page_range(
        self,
        content: bytes,
        filename: str,
        start_page: int,
        end_page: int,
    ) -> tuple[bytes, str, int]:
        """
        Extract an inclusive page range from a PDF.

        Page numbers are 1-based.

        Example:
            start_page=3
            end_page=7

        extracts pages 3 through 7.
        """

        if not content:
            raise ValueError(
                "PDF file is empty."
            )

        if start_page < 1:
            raise ValueError(
                "Start page must be at least 1."
            )

        if end_page < 1:
            raise ValueError(
                "End page must be at least 1."
            )

        if start_page > end_page:
            raise ValueError(
                "Start page must not be greater than end page."
            )

        try:
            reader = PdfReader(
                BytesIO(content)
            )
        except Exception as exc:
            raise ValueError(
                f"Unable to read PDF file: {exc}"
            ) from exc

        page_count = len(reader.pages)

        if page_count == 0:
            raise ValueError(
                "PDF contains no pages."
            )

        if start_page > page_count:
            raise ValueError(
                f"Start page exceeds PDF page count ({page_count})."
            )

        if end_page > page_count:
            raise ValueError(
                f"End page exceeds PDF page count ({page_count})."
            )

        writer = PdfWriter()

        for page_index in range(
            start_page - 1,
            end_page,
        ):
            writer.add_page(
                reader.pages[page_index]
            )

        output_buffer = BytesIO()

        writer.write(
            output_buffer
        )

        output_filename = (
            f"extracted_{start_page}-{end_page}.pdf"
        )

        extracted_page_count = (
            end_page - start_page + 1
        )

        return (
            output_buffer.getvalue(),
            output_filename,
            extracted_page_count,
        )

pdf_service = PdfService()