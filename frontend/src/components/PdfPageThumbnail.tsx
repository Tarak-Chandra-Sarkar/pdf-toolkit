import React from "react";

import {
  getPdfPreviewUrl,
} from "../services/api";


interface PdfPageThumbnailProps {
  fileId: string;
  pageNumber: number;

  /**
   * Whether this page is currently
   * selected for PDF management.
   */
  selected: boolean;

  /**
   * Whether this page is currently
   * being shown in the large preview.
   */
  previewSelected?: boolean;

  /**
   * Called when the thumbnail itself
   * is clicked.
   */
  onClick: () => void;

  /**
   * Called when the checkbox is changed.
   */
  onSelectionChange?: (
    selected: boolean,
  ) => void;
}


export const PdfPageThumbnail: React.FC<
  PdfPageThumbnailProps
> = ({
  fileId,
  pageNumber,
  selected,
  previewSelected = false,
  onClick,
  onSelectionChange,
}) => {

  const previewUrl =
    getPdfPreviewUrl(
      fileId,
      pageNumber,
    );


  function handleCheckboxChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {

    /*
     * Prevent the checkbox click from
     * triggering the thumbnail button.
     */
    event.stopPropagation();


    if (onSelectionChange) {
      onSelectionChange(
        event.target.checked,
      );
    }

  }


  function handleCheckboxClick(
    event: React.MouseEvent,
  ) {

    /*
     * Prevent click from reaching
     * the thumbnail button.
     */
    event.stopPropagation();

  }


  return (
    <div
      className={[
        "relative w-full overflow-hidden rounded-xl",
        "border-2 bg-white",
        "transition-all duration-150",

        previewSelected
          ? "border-slate-900 shadow-md ring-2 ring-slate-900 ring-offset-2"
          : "border-slate-200 hover:border-slate-400 hover:shadow-sm",

      ].join(" ")}
    >

      {/* ================================================= */}
      {/* Thumbnail button                                  */}
      {/* ================================================= */}

      <button
        type="button"
        onClick={onClick}
        className="
          block
          w-full
          text-left
          focus:outline-none
          focus:ring-2
          focus:ring-slate-400
          focus:ring-inset
        "
        aria-label={`Preview page ${pageNumber}`}
      >

        {/* ----------------------------------------------- */}
        {/* Page number                                     */}
        {/* ----------------------------------------------- */}

        <div
          className="
            absolute
            left-2
            top-2
            z-20
            flex
            h-7
            w-7
            items-center
            justify-center
            rounded-full
            bg-white
            text-xs
            font-bold
            text-slate-700
            shadow-md
            ring-1
            ring-slate-200
          "
        >
          {pageNumber}
        </div>


        {/* ----------------------------------------------- */}
        {/* Thumbnail image                                 */}
        {/* ----------------------------------------------- */}

        <div
          className="
            flex
            min-h-[180px]
            items-center
            justify-center
            bg-slate-100
            p-2
          "
        >

          <img
            src={previewUrl}
            alt={`Page ${pageNumber}`}
            className="
              max-h-[240px]
              w-full
              rounded-md
              bg-white
              object-contain
              shadow-sm
            "
            loading="lazy"
          />

        </div>


        {/* ----------------------------------------------- */}
        {/* Footer                                          */}
        {/* ----------------------------------------------- */}

        <div
          className="
            border-t
            border-slate-100
            bg-white
            px-3
            py-2
          "
        >

          <p
            className="
              text-center
              text-xs
              font-medium
              text-slate-600
            "
          >
            Page {pageNumber}
          </p>

        </div>

      </button>


      {/* ================================================= */}
      {/* Individual selection checkbox                     */}
      {/* ================================================= */}

      <div
        className="
          absolute
          right-2
          top-2
          z-[100]
          flex
          items-center
          justify-center
        "
        onClick={handleCheckboxClick}
      >

        <label
          className="
            flex
            h-9
            w-9
            cursor-pointer
            items-center
            justify-center
            rounded-lg
            border
            border-slate-300
            bg-white
            shadow-lg
            transition
            hover:border-slate-500
            hover:bg-slate-50
          "
          title={
            selected
              ? `Deselect page ${pageNumber}`
              : `Select page ${pageNumber}`
          }
        >

          <input
            type="checkbox"
            checked={selected}
            onChange={
              handleCheckboxChange
            }
            aria-label={
              selected
                ? `Deselect page ${pageNumber}`
                : `Select page ${pageNumber}`
            }
            className="
              h-5
              w-5
              cursor-pointer
              appearance-auto
              accent-slate-900
            "
          />

        </label>

      </div>


      {/* ================================================= */}
      {/* Selected indicator                                */}
      {/* ================================================= */}

      {selected && (

        <div
          className="
            pointer-events-none
            absolute
            bottom-12
            left-2
            z-30
            rounded-md
            bg-slate-900
            px-2
            py-1
            text-[10px]
            font-semibold
            text-white
            shadow-md
          "
        >
          Selected
        </div>

      )}


      {/* ================================================= */}
      {/* Preview indicator                                 */}
      {/* ================================================= */}

      {previewSelected && (

        <div
          className="
            pointer-events-none
            absolute
            bottom-12
            right-2
            z-30
            rounded-md
            bg-blue-600
            px-2
            py-1
            text-[10px]
            font-semibold
            text-white
            shadow-md
          "
        >
          Preview
        </div>

      )}

    </div>
  );
};