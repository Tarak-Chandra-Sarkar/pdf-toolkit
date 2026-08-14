import {
  getPdfPreviewUrl,
} from "../services/api";


interface PdfViewerProps {
  fileId: string;
  pageNumber: number;
  pageCount: number;

  onPageChange: (
    pageNumber: number,
  ) => void;
}


export function PdfViewer({
  fileId,
  pageNumber,
  pageCount,
  onPageChange,
}: PdfViewerProps) {

  const imageUrl =
    getPdfPreviewUrl(
      fileId,
      pageNumber,
    );


  const previousDisabled =
    pageNumber <= 1;

  const nextDisabled =
    pageNumber >= pageCount;


  return (
    <div className="flex min-h-[700px] flex-col rounded-xl border border-slate-200 bg-slate-100">

      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">

        <button
          type="button"
          disabled={previousDisabled}

          onClick={() =>
            onPageChange(
              pageNumber - 1,
            )
          }

          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          ← Previous
        </button>


        <span className="text-sm font-medium text-slate-600">
          Page {pageNumber} of {pageCount}
        </span>


        <button
          type="button"
          disabled={nextDisabled}

          onClick={() =>
            onPageChange(
              pageNumber + 1,
            )
          }

          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next →
        </button>

      </div>


      <div className="flex flex-1 items-center justify-center overflow-auto p-6">

        <img
          src={imageUrl}
          alt={`PDF page ${pageNumber}`}
          className="max-h-[650px] max-w-full rounded-md bg-white shadow-lg"
        />

      </div>

    </div>
  );
}