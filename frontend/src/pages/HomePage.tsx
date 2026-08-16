import {
  useEffect,
  useState,
} from "react";

import {
  PdfDropZone,
} from "../components/PdfDropZone";

import {
  PdfPageThumbnail,
} from "../components/PdfPageThumbnail";

import {
  PdfViewer,
} from "../components/PdfViewer";

import {
  deletePdf,
  deletePdfPages,
  getHealth,
  getPdfDownloadUrl,
  rotatePdfPages,
  uploadPdf,
} from "../services/api";

import type {
  PdfInfo,
} from "../types/api";


type BackendStatus =
  | "checking"
  | "online"
  | "offline";


type Rotation =
  | 90
  | 180
  | 270;


/* ====================================================
 * HOME PAGE
 * ==================================================== */

export function HomePage() {

  const [
    backendStatus,
    setBackendStatus,
  ] = useState<BackendStatus>(
    "checking",
  );


  const [
    pdf,
    setPdf,
  ] = useState<PdfInfo | null>(
    null,
  );


  /*
   * Current page displayed in large viewer.
   */
  const [
    selectedPage,
    setSelectedPage,
  ] = useState<number>(1);


  /*
   * Pages selected for management operations.
   */
  const [
    selectedPages,
    setSelectedPages,
  ] = useState<number[]>([]);


  const [
    uploading,
    setUploading,
  ] = useState(false);


  const [
    processing,
    setProcessing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  const [
    success,
    setSuccess,
  ] = useState<string | null>(
    null,
  );


  /*
   * Rotation selected in action toolbar.
   */
  const [
    rotation,
    setRotation,
  ] = useState<Rotation>(90);


  /* ==================================================
   * BACKEND HEALTH
   * ================================================== */

  useEffect(() => {

    let mounted = true;

    async function checkBackend() {

      try {

        await getHealth();

        if (mounted) {
          setBackendStatus("online");
        }

      } catch {

        if (mounted) {
          setBackendStatus("offline");
        }

      }

    }

    checkBackend();

    return () => {
      mounted = false;
    };

  }, []);


  /* ==================================================
   * UPLOAD
   * ================================================== */

  async function handleFileSelected(
    file: File,
  ) {

    setError(null);
    setSuccess(null);
    setUploading(true);

    try {

      const uploadedPdf =
        await uploadPdf(file);

      setPdf(uploadedPdf);

      setSelectedPage(1);

      setSelectedPages([]);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload the PDF.",
      );

    } finally {

      setUploading(false);

    }

  }


  /* ==================================================
   * REMOVE PDF
   * ================================================== */

  async function handleReset() {

    if (!pdf) {
      return;
    }

    try {

      await deletePdf(
        pdf.file_id,
      );

    } catch {
      // Ignore cleanup errors.
    }

    setPdf(null);

    setSelectedPage(1);

    setSelectedPages([]);

    setError(null);

    setSuccess(null);

  }


  /* ==================================================
   * INDIVIDUAL PAGE SELECTION
   *
   * IMPORTANT:
   * This only changes selectedPages.
   * It does NOT change selectedPage.
   * ================================================== */

  function togglePageSelection(
    pageNumber: number,
  ) {

    setSelectedPages(
      (currentPages) => {

        if (
          currentPages.includes(
            pageNumber,
          )
        ) {

          return currentPages.filter(
            (page) =>
              page !== pageNumber,
          );

        }

        return [
          ...currentPages,
          pageNumber,
        ].sort(
          (a, b) => a - b,
        );

      },
    );

    /*
     * Clear old messages whenever
     * selection changes.
     */
    setError(null);
    setSuccess(null);

  }


  /* ==================================================
   * SELECT ALL
   * ================================================== */

  function handleSelectAll() {

    if (!pdf) {
      return;
    }

    const allPages =
      Array.from(
        {
          length:
            pdf.page_count,
        },
        (_, index) =>
          index + 1,
      );

    setSelectedPages(
      allPages,
    );

    setError(null);
    setSuccess(null);

  }


  /* ==================================================
   * CLEAR
   * ================================================== */

  function handleClearSelection() {

    setSelectedPages([]);

    setError(null);
    setSuccess(null);

  }


  /* ==================================================
   * PREVIEW PAGE
   * ================================================== */

  function handlePageChange(
    pageNumber: number,
  ) {

    if (!pdf) {
      return;
    }

    if (
      pageNumber < 1 ||
      pageNumber > pdf.page_count
    ) {
      return;
    }

    setSelectedPage(
      pageNumber,
    );

  }


  /* ==================================================
   * DOWNLOAD BLOB
   * ================================================== */

  function downloadBlob(
    blob: Blob,
    filename: string,
  ) {

    const url =
      window.URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement(
        "a",
      );

    link.href = url;

    link.download =
      filename;

    document.body.appendChild(
      link,
    );

    link.click();

    link.remove();

    window.URL.revokeObjectURL(
      url,
    );

  }


  /* ==================================================
   * GET CURRENT PDF AS FILE
   *
   * The backend operations expect:
   *
   * File + pages
   *
   * But HomePage currently stores PdfInfo.
   *
   * Therefore download the uploaded PDF from
   * the backend and convert it into a File.
   * ================================================== */

  async function getCurrentPdfFile():
    Promise<File> {

    if (!pdf) {
      throw new Error(
        "No PDF is currently loaded.",
      );
    }

    const response =
      await fetch(
        getPdfDownloadUrl(
          pdf.file_id,
        ),
      );

    if (!response.ok) {
      throw new Error(
        "Unable to retrieve the current PDF.",
      );
    }

    const blob =
      await response.blob();

    return new File(
      [blob],
      pdf.filename,
      {
        type:
          "application/pdf",
      },
    );

  }


  /* ==================================================
   * DELETE SELECTED PAGES
   * ================================================== */

  async function handleDeletePages() {

    if (!pdf) {
      return;
    }

    if (
      selectedPages.length === 0
    ) {
      return;
    }

    /*
     * Do not allow deleting every page.
     *
     * A PDF must contain at least one page.
     */
    if (
      selectedPages.length >=
      pdf.page_count
    ) {

      setError(
        "You cannot delete all pages. At least one page must remain.",
      );

      return;
    }

    setError(null);
    setSuccess(null);
    setProcessing(true);

    try {

      const currentPdf =
        await getCurrentPdfFile();

      const result =
        await deletePdfPages(
          currentPdf,
          selectedPages,
        );

      downloadBlob(
        result,
        `deleted_pages_${pdf.filename}`,
      );

      setSuccess(
        `${selectedPages.length} ${
          selectedPages.length === 1
            ? "page"
            : "pages"
        } deleted successfully.`,
      );

      /*
       * Clear selection after operation.
       */
      setSelectedPages([]);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete selected pages.",
      );

    } finally {

      setProcessing(false);

    }

  }


  /* ==================================================
   * ROTATE SELECTED PAGES
   * ================================================== */

  async function handleRotatePages() {

    if (!pdf) {
      return;
    }

    if (
      selectedPages.length === 0
    ) {
      return;
    }

    setError(null);
    setSuccess(null);
    setProcessing(true);

    try {

      const currentPdf =
        await getCurrentPdfFile();

      const result =
        await rotatePdfPages(
          currentPdf,
          selectedPages,
          rotation,
        );

      downloadBlob(
        result,
        `rotated_${rotation}_${pdf.filename}`,
      );

      setSuccess(
        `${selectedPages.length} ${
          selectedPages.length === 1
            ? "page"
            : "pages"
        } rotated by ${rotation}° successfully.`,
      );

      setSelectedPages([]);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to rotate selected pages.",
      );

    } finally {

      setProcessing(false);

    }

  }


  /* ==================================================
   * UPLOAD WORKSPACE
   * ================================================== */

  if (!pdf) {

    return (
      <UploadWorkspace
        uploading={uploading}
        error={error}
        backendStatus={
          backendStatus
        }
        onFileSelected={
          handleFileSelected
        }
      />
    );

  }


  /* ==================================================
   * PDF WORKSPACE
   * ================================================== */

  return (
    <PdfWorkspace
      pdf={pdf}
      selectedPage={selectedPage}
      selectedPages={selectedPages}
      error={error}
      success={success}
      processing={processing}
      rotation={rotation}
      onRotationChange={
        setRotation
      }
      onPageChange={
        handlePageChange
      }
      onTogglePageSelection={
        togglePageSelection
      }
      onSelectAll={
        handleSelectAll
      }
      onClearSelection={
        handleClearSelection
      }
      onDeletePages={
        handleDeletePages
      }
      onRotatePages={
        handleRotatePages
      }
      onReset={
        handleReset
      }
    />
  );

}


/* ====================================================
 * UPLOAD WORKSPACE
 * ==================================================== */

interface UploadWorkspaceProps {

  uploading: boolean;

  error: string | null;

  backendStatus:
    BackendStatus;

  onFileSelected: (
    file: File,
  ) => void;

}


function UploadWorkspace({
  uploading,
  error,
  backendStatus,
  onFileSelected,
}: UploadWorkspaceProps) {

  return (
    <div className="mx-auto max-w-3xl">

      <div className="mb-10 text-center">

        <div className="
          mb-5
          inline-flex
          rounded-full
          border
          border-slate-200
          bg-white
          px-4
          py-2
          text-sm
          text-slate-600
          shadow-sm
        ">
          🔒 Local-first PDF processing
        </div>

        <h1 className="
          text-4xl
          font-bold
          tracking-tight
          text-slate-900
        ">
          Work with your PDF
        </h1>

        <p className="
          mx-auto
          mt-4
          max-w-xl
          text-slate-600
        ">
          Upload a PDF to preview its pages
          and prepare it for the PDF tools.
        </p>

      </div>


      <PdfDropZone
        disabled={uploading}
        onFileSelected={
          onFileSelected
        }
      />


      {uploading && (

        <div className="
          mt-4
          rounded-xl
          border
          border-slate-200
          bg-white
          p-4
          text-center
        ">

          <p className="
            text-sm
            font-medium
            text-slate-700
          ">
            Uploading and inspecting PDF...
          </p>

        </div>

      )}


      {error && (

        <div className="
          mt-4
          rounded-xl
          border
          border-red-200
          bg-red-50
          px-4
          py-3
          text-sm
          text-red-700
        ">
          {error}
        </div>

      )}


      <div className="
        mt-8
        flex
        items-center
        justify-between
        rounded-xl
        border
        border-slate-200
        bg-white
        px-5
        py-4
      ">

        <div>

          <p className="
            text-sm
            font-medium
            text-slate-900
          ">
            Backend
          </p>

          <p className="
            text-xs
            text-slate-500
          ">
            FastAPI connectivity
          </p>

        </div>


        <span
          className={[
            "rounded-full px-3 py-1",
            "text-xs font-medium",

            backendStatus ===
            "online"
              ? "bg-emerald-50 text-emerald-700"

              : backendStatus ===
                  "offline"
                ? "bg-red-50 text-red-700"

                : "bg-amber-50 text-amber-700",

          ].join(" ")}
        >

          {backendStatus ===
          "online"

            ? "● Online"

            : backendStatus ===
                "offline"

              ? "● Offline"

              : "Checking..."}

        </span>

      </div>

    </div>
  );

}


/* ====================================================
 * PDF WORKSPACE
 * ==================================================== */

interface PdfWorkspaceProps {

  pdf: PdfInfo;

  selectedPage: number;

  selectedPages: number[];

  error: string | null;

  success: string | null;

  processing: boolean;

  rotation: Rotation;

  onRotationChange: (
    rotation: Rotation,
  ) => void;

  onPageChange: (
    pageNumber: number,
  ) => void;

  onTogglePageSelection: (
    pageNumber: number,
  ) => void;

  onSelectAll: () => void;

  onClearSelection: () => void;

  onDeletePages: () => void;

  onRotatePages: () => void;

  onReset: () => void;

}


function PdfWorkspace({
  pdf,
  selectedPage,
  selectedPages,
  error,
  success,
  processing,
  rotation,
  onRotationChange,
  onPageChange,
  onTogglePageSelection,
  onSelectAll,
  onClearSelection,
  onDeletePages,
  onRotatePages,
  onReset,
}: PdfWorkspaceProps) {

  const hasSelection =
    selectedPages.length > 0;


  const allPagesSelected =
    selectedPages.length ===
      pdf.page_count &&
    pdf.page_count > 0;


  return (
    <div>

      {/* ============================================
       * HEADER
       * ========================================== */}

      <div className="
        mb-6
        flex
        flex-col
        gap-4
        sm:flex-row
        sm:items-center
        sm:justify-between
      ">

        <div>

          <h1 className="
            text-2xl
            font-bold
            text-slate-900
          ">
            {pdf.filename}
          </h1>

          <p className="
            mt-1
            text-sm
            text-slate-500
          ">

            {formatBytes(
              pdf.size_bytes,
            )}

            {" • "}

            {pdf.page_count}

            {" "}

            {pdf.page_count === 1
              ? "page"
              : "pages"}

          </p>

        </div>


        <button
          type="button"
          onClick={onReset}
          disabled={processing}
          className="
            rounded-lg
            border
            border-slate-200
            bg-white
            px-4
            py-2
            text-sm
            font-medium
            text-slate-700
            hover:bg-slate-50
            disabled:cursor-not-allowed
            disabled:opacity-50
          "
        >
          Remove PDF
        </button>

      </div>


      {/* ============================================
       * MESSAGES
       * ========================================== */}

      {error && (

        <div className="
          mb-4
          rounded-xl
          border
          border-red-200
          bg-red-50
          px-4
          py-3
          text-sm
          text-red-700
        ">
          {error}
        </div>

      )}


      {success && (

        <div className="
          mb-4
          rounded-xl
          border
          border-emerald-200
          bg-emerald-50
          px-4
          py-3
          text-sm
          text-emerald-700
        ">
          {success}
        </div>

      )}


      {/* ============================================
       * PAGE SELECTION + ACTION TOOLBAR
       * ========================================== */}

      <div className="
        mb-6
        rounded-xl
        border
        border-slate-200
        bg-white
        p-4
      ">

        <div className="
          flex
          flex-col
          gap-4
          lg:flex-row
          lg:items-center
          lg:justify-between
        ">

          {/* Selection information */}

          <div>

            <p className="
              text-sm
              font-semibold
              text-slate-900
            ">
              Page Selection
            </p>

            <p className="
              mt-1
              text-xs
              text-slate-500
            ">

              {hasSelection
                ? `${selectedPages.length} ${
                    selectedPages.length === 1
                      ? "page"
                      : "pages"
                  } selected`
                : "Select one or more pages to enable actions"}

            </p>

          </div>


          {/* Selection controls */}

          <div className="
            flex
            flex-wrap
            gap-2
          ">

            <button
              type="button"
              onClick={onSelectAll}
              disabled={
                allPagesSelected ||
                processing
              }
              className="
                rounded-lg
                border
                border-slate-200
                bg-white
                px-3
                py-2
                text-xs
                font-medium
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Select All
            </button>


            <button
              type="button"
              onClick={onClearSelection}
              disabled={
                !hasSelection ||
                processing
              }
              className="
                rounded-lg
                border
                border-slate-200
                bg-white
                px-3
                py-2
                text-xs
                font-medium
                text-slate-700
                transition
                hover:bg-slate-50
                disabled:cursor-not-allowed
                disabled:opacity-40
              "
            >
              Clear
            </button>

          </div>

        </div>


        {/* ==========================================
         * PAGE ACTIONS
         * ======================================== */}

        <div className="
          mt-4
          border-t
          border-slate-100
          pt-4
        ">

          <div className="
            flex
            flex-col
            gap-3
            sm:flex-row
            sm:items-center
          ">

            {/* Delete */}

            <button
              type="button"
              onClick={onDeletePages}
              disabled={
                !hasSelection ||
                processing ||
                selectedPages.length >=
                  pdf.page_count
              }
              className="
                inline-flex
                items-center
                justify-center
                gap-2
                rounded-lg
                px-4
                py-2
                text-sm
                font-semibold
                transition

                disabled:cursor-not-allowed
                disabled:opacity-40

                enabled:bg-red-600
                enabled:text-white
                enabled:hover:bg-red-700
              "
              title={
                selectedPages.length >=
                pdf.page_count
                  ? "At least one page must remain"
                  : undefined
              }
            >

              🗑

              {processing
                ? "Processing..."
                : "Delete Pages"}

            </button>


            {/* Rotation */}

            <div className="
              flex
              items-center
              gap-2
            ">

              <select
                value={rotation}
                onChange={(event) =>
                  onRotationChange(
                    Number(
                      event.target.value,
                    ) as Rotation,
                  )
                }
                disabled={
                  !hasSelection ||
                  processing
                }
                className="
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-3
                  py-2
                  text-sm
                  font-medium
                  text-slate-700
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >

                <option value={90}>
                  90°
                </option>

                <option value={180}>
                  180°
                </option>

                <option value={270}>
                  270°
                </option>

              </select>


              <button
                type="button"
                onClick={onRotatePages}
                disabled={
                  !hasSelection ||
                  processing
                }
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  rounded-lg
                  border
                  border-slate-200
                  bg-white
                  px-4
                  py-2
                  text-sm
                  font-semibold
                  text-slate-700
                  transition
                  hover:bg-slate-50
                  disabled:cursor-not-allowed
                  disabled:opacity-40
                "
              >

                ↻

                Rotate Selected

              </button>

            </div>


            {/* Selection status */}

            <div className="
              ml-auto
              hidden
              rounded-lg
              bg-slate-100
              px-3
              py-2
              text-xs
              font-medium
              text-slate-600
              sm:block
            ">

              {hasSelection
                ? `${selectedPages.length} selected`
                : "No selection"}

            </div>

          </div>

        </div>

      </div>


      {/* ============================================
       * MAIN WORKSPACE
       * ========================================== */}

      <div className="
        grid
        gap-6
        lg:grid-cols-[260px_1fr]
      ">

        {/* ==========================================
         * THUMBNAILS
         * ======================================== */}

        <aside className="
          rounded-xl
          border
          border-slate-200
          bg-white
          p-3
        ">

          <div className="mb-3 px-2">

            <p className="
              text-sm
              font-semibold
              text-slate-900
            ">
              Pages
            </p>

            <p className="
              text-xs
              text-slate-500
            ">
              {pdf.page_count} pages
            </p>

          </div>


          <div className="
            grid
            max-h-[720px]
            gap-3
            overflow-y-auto
            pr-1
          ">

            {Array.from(
              {
                length:
                  pdf.page_count,
              },
              (_, index) => {

                const pageNumber =
                  index + 1;


                const isSelected =
                  selectedPages.includes(
                    pageNumber,
                  );


                const isPreviewPage =
                  selectedPage ===
                  pageNumber;


                return (

                  <div
                    key={pageNumber}
                    className={[
                      "rounded-xl border-2 bg-white p-2 transition-all",

                      isSelected
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200",

                      isPreviewPage
                        ? "ring-2 ring-slate-900 ring-offset-1"
                        : "",

                    ].join(" ")}
                  >

                    {/* =================================
                     * SELECTION CONTROL
                     * ================================= */}

                    <div className="
                      mb-2
                      flex
                      items-center
                      justify-between
                    ">

                      <button
                        type="button"
                        disabled={processing}
                        onClick={() => {

                          onTogglePageSelection(
                            pageNumber,
                          );

                        }}
                        aria-pressed={
                          isSelected
                        }
                        className="
                          flex
                          cursor-pointer
                          items-center
                          gap-2
                          rounded-md
                          px-2
                          py-1
                          text-xs
                          font-semibold
                          transition
                          hover:bg-slate-100
                          focus:outline-none
                          focus:ring-2
                          focus:ring-blue-500
                          disabled:cursor-not-allowed
                          disabled:opacity-50
                        "
                      >

                        <span
                          className={[
                            "flex h-5 w-5",
                            "shrink-0 items-center",
                            "justify-center rounded",
                            "border-2 text-xs font-bold",

                            isSelected
                              ? "border-blue-600 bg-blue-600 text-white"
                              : "border-slate-500 bg-white text-transparent",

                          ].join(" ")}
                        >
                          ✓
                        </span>


                        <span
                          className={
                            isSelected
                              ? "text-blue-700"
                              : "text-slate-700"
                          }
                        >
                          {isSelected
                            ? "Selected"
                            : "Select"}
                        </span>

                      </button>


                      <span
                        className={[
                          "rounded-full px-2 py-1",
                          "text-[10px] font-semibold",

                          isPreviewPage
                            ? "bg-slate-900 text-white"
                            : "bg-slate-100 text-slate-600",

                        ].join(" ")}
                      >
                        Page {pageNumber}
                      </span>

                    </div>


                    {/* =================================
                     * THUMBNAIL
                     *
                     * IMPORTANT:
                     * Clicking this previews only.
                     * ================================= */}

                    <div
                      onClick={() => {

                        if (!processing) {

                          onPageChange(
                            pageNumber,
                          );

                        }

                      }}
                      className="
                        cursor-pointer
                      "
                    >

                      <PdfPageThumbnail
                        fileId={
                          pdf.file_id
                        }
                        pageNumber={
                          pageNumber
                        }
                        selected={
                          isPreviewPage
                        }
                        onClick={() => {

                          onPageChange(
                            pageNumber,
                          );

                        }}
                      />

                    </div>


                    {/* =================================
                     * SELECTED INDICATOR
                     * ================================= */}

                    {isSelected && (

                      <div className="
                        mt-2
                        flex
                        items-center
                        justify-center
                        rounded-md
                        bg-blue-600
                        px-2
                        py-1
                      ">

                        <span className="
                          text-xs
                          font-semibold
                          text-white
                        ">
                          ✓ Page Selected
                        </span>

                      </div>

                    )}

                  </div>

                );

              },
            )}

          </div>

        </aside>


        {/* ==========================================
         * PDF VIEWER
         * ======================================== */}

        <PdfViewer
          fileId={
            pdf.file_id
          }
          pageNumber={
            selectedPage
          }
          pageCount={
            pdf.page_count
          }
          onPageChange={
            onPageChange
          }
        />

      </div>


      {/* ============================================
       * SELECTED PAGE SUMMARY
       * ========================================== */}

      {hasSelection && (

        <div className="
          mt-6
          rounded-xl
          border
          border-blue-200
          bg-blue-50
          px-4
          py-3
        ">

          <div className="
            flex
            flex-col
            gap-2
            sm:flex-row
            sm:items-center
            sm:justify-between
          ">

            <div>

              <p className="
                text-sm
                font-semibold
                text-blue-900
              ">
                Selected Pages
              </p>

              <p className="
                mt-1
                text-xs
                text-blue-700
              ">
                {formatSelectedPages(
                  selectedPages,
                )}
              </p>

            </div>


            <div className="
              rounded-lg
              bg-white
              px-3
              py-2
              text-xs
              font-semibold
              text-blue-700
            ">

              {selectedPages.length}

              {" "}

              {selectedPages.length === 1
                ? "page"
                : "pages"}

            </div>

          </div>

        </div>

      )}

    </div>
  );

}


/* ====================================================
 * FORMAT FILE SIZE
 * ==================================================== */

function formatBytes(
  bytes: number,
): string {

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (
    bytes <
    1024 * 1024
  ) {

    return `${(
      bytes / 1024
    ).toFixed(1)} KB`;

  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;

}


/* ====================================================
 * FORMAT SELECTED PAGES
 * ==================================================== */

function formatSelectedPages(
  pages: number[],
): string {

  if (
    pages.length === 0
  ) {
    return "None";
  }


  const sortedPages =
    [...pages].sort(
      (a, b) => a - b,
    );


  const ranges: string[] = [];


  let rangeStart =
    sortedPages[0];

  let previous =
    sortedPages[0];


  for (
    let index = 1;
    index < sortedPages.length;
    index += 1
  ) {

    const current =
      sortedPages[index];


    if (
      current ===
      previous + 1
    ) {

      previous =
        current;

      continue;

    }


    ranges.push(
      formatPageRange(
        rangeStart,
        previous,
      ),
    );


    rangeStart =
      current;

    previous =
      current;

  }


  ranges.push(
    formatPageRange(
      rangeStart,
      previous,
    ),
  );


  return ranges.join(
    ", ",
  );

}


/* ====================================================
 * FORMAT PAGE RANGE
 * ==================================================== */

function formatPageRange(
  start: number,
  end: number,
): string {

  if (
    start === end
  ) {
    return String(start);
  }

  return `${start}-${end}`;

}