from pathlib import Path
from uuid import uuid4

import pymupdf


def _validate_pdf(file_path: Path) -> None:
    if not file_path.exists():
        raise ValueError("PDF file does not exist.")

    if file_path.stat().st_size == 0:
        raise ValueError("PDF file is empty.")


def _open_pdf(file_path: Path):
    _validate_pdf(file_path)

    try:
        document = pymupdf.open(file_path)
    except Exception as exc:
        raise ValueError(
            "Unable to read PDF file."
        ) from exc

    if document.page_count == 0:
        document.close()

        raise ValueError(
            "PDF does not contain any pages."
        )

    return document


def _validate_page_numbers(
    page_numbers: list[int],
    page_count: int,
) -> None:

    if not page_numbers:
        raise ValueError(
            "At least one page must be specified."
        )

    invalid_pages = [
        page
        for page in page_numbers
        if page < 1 or page > page_count
    ]

    if invalid_pages:
        raise ValueError(
            f"Invalid page number(s): {invalid_pages}. "
            f"PDF contains {page_count} page(s)."
        )

    if len(set(page_numbers)) != len(page_numbers):
        raise ValueError(
            "Duplicate page numbers are not allowed."
        )


def _output_path(
    output_dir: Path,
    prefix: str,
) -> Path:

    output_dir.mkdir(
        parents=True,
        exist_ok=True,
    )

    return (
        output_dir
        / f"{prefix}_{uuid4().hex}.pdf"
    )


def delete_pages(
    input_path: Path,
    output_dir: Path,
    pages: list[int],
) -> Path:

    document = _open_pdf(input_path)

    try:

        _validate_page_numbers(
            pages,
            document.page_count,
        )

        if len(pages) >= document.page_count:
            raise ValueError(
                "Cannot delete all pages from a PDF."
            )

        # PyMuPDF uses zero-based indexes.
        indexes = sorted(
            {
                page - 1
                for page in pages
            },
            reverse=True,
        )

        for index in indexes:
            document.delete_page(index)

        output_path = _output_path(
            output_dir,
            "deleted_pages",
        )

        document.save(
            output_path,
            garbage=4,
            deflate=True,
        )

        return output_path

    finally:
        document.close()


def reorder_pages(
    input_path: Path,
    output_dir: Path,
    order: list[int],
) -> Path:

    document = _open_pdf(input_path)

    try:

        page_count = document.page_count

        if len(order) != page_count:
            raise ValueError(
                "The reorder list must contain "
                f"exactly {page_count} page numbers."
            )

        expected = set(
            range(1, page_count + 1)
        )

        actual = set(order)

        if actual != expected:
            raise ValueError(
                "Reorder list must contain every "
                "page number exactly once."
            )

        zero_based_order = [
            page - 1
            for page in order
        ]

        document.select(
            zero_based_order
        )

        output_path = _output_path(
            output_dir,
            "reordered",
        )

        document.save(
            output_path,
            garbage=4,
            deflate=True,
        )

        return output_path

    finally:
        document.close()


def rotate_pages(
    input_path: Path,
    output_dir: Path,
    pages: list[int],
    rotation: int,
) -> Path:

    document = _open_pdf(input_path)

    try:

        _validate_page_numbers(
            pages,
            document.page_count,
        )

        if rotation not in {
            90,
            180,
            270,
        }:
            raise ValueError(
                "Rotation must be 90, 180, or 270 degrees."
            )

        for page_number in pages:

            page = document[
                page_number - 1
            ]

            current_rotation = (
                page.rotation
            )

            new_rotation = (
                current_rotation
                + rotation
            ) % 360

            page.set_rotation(
                new_rotation
            )

        output_path = _output_path(
            output_dir,
            "rotated",
        )

        document.save(
            output_path,
            garbage=4,
            deflate=True,
        )

        return output_path

    finally:
        document.close()