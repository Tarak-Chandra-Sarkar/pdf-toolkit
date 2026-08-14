import {
  getPdfPreviewUrl,
} from "../services/api";


interface PdfPageThumbnailProps {
  fileId: string;
  pageNumber: number;
  selected: boolean;
  onClick: () => void;
}


export function PdfPageThumbnail({
  fileId,
  pageNumber,
  selected,
  onClick,
}: PdfPageThumbnailProps) {

  const imageUrl =
    getPdfPreviewUrl(
      fileId,
      pageNumber,
    );


  return (
    <button
      type="button"
      onClick={onClick}

      className={[
        "group w-full rounded-lg",
        "border bg-white p-2",
        "text-left transition",

        selected
          ? "border-slate-900 ring-2 ring-slate-200"
          : "border-slate-200 hover:border-slate-400",
      ].join(" ")}
    >

      <div className="aspect-[3/4] overflow-hidden rounded bg-slate-100">

        <img
          src={imageUrl}
          alt={`Page ${pageNumber}`}
          className="h-full w-full object-contain"
          loading="lazy"
        />

      </div>


      <p className="mt-2 text-center text-xs font-medium text-slate-600">
        Page {pageNumber}
      </p>

    </button>
  );
}