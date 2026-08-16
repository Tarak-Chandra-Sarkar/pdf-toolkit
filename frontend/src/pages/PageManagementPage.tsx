import {
  useEffect,
  useMemo,
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
  reorderPdfPages,
  rotatePdfPages,
  uploadPdf,
} from "../services/api";

import type {
  PdfInfo,
} from "../types/api";


type Operation =
  | "delete"
  | "rotate"
  | "reorder"
  | null;


export function PageManagementPage() {

  const [
    file,
    setFile,
  ] = useState<File | null>(null);


  const [
    pdf,
    setPdf,
  ] = useState<PdfInfo | null>(null);


  const [
    selectedPages,
    setSelectedPages,
  ] = useState<number[]>([]);


  const [
    pageOrder,
    setPageOrder,
  ] = useState<number[]>([]);


  const [
    selectedPage,
    setSelectedPage,
  ] = useState(1);


  const [
    operation,
    setOperation,
  ] = useState<Operation>(null);


  const [
    processing,
    setProcessing,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<string | null>(null);


  const [
    success,
    setSuccess,
  ] = useState<string | null>(null);


  const [
    rotation,
    setRotation,
  ] = useState<90 | 180 | 270>(90);


  useEffect(() => {

    if (!pdf) {
      setPageOrder([]);
      return;
    }

    setPageOrder(
      Array.from(
        {
          length: pdf.page_count,
        },
        (_, index) => index + 1,
      ),
    );

    setSelectedPages([]);

    setSelectedPage(1);

  }, [pdf]);


  const selectedPageSet = useMemo(
    () => new Set(selectedPages),
    [selectedPages],
  );


  function clearMessages() {
    setError(null);
    setSuccess(null);
  }


  async function handleFileSelected(
    selectedFile: File,
  ) {

    clearMessages();

    setProcessing(true);

    try {

      if (
        !selectedFile.name
          .toLowerCase()
          .endsWith(".pdf")
      ) {
        throw new Error(
          "Please select a PDF file.",
        );
      }

      const uploadedPdf =
        await uploadPdf(
          selectedFile,
        );

      setFile(selectedFile);
      setPdf(uploadedPdf);

    } catch (err) {

      setFile(null);
      setPdf(null);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to upload PDF.",
      );

    } finally {

      setProcessing(false);

    }
  }


  function togglePage(
    pageNumber: number,
  ) {

    clearMessages();

    setSelectedPages(
      current => {

        if (
          current.includes(pageNumber)
        ) {
          return current.filter(
            page =>
              page !== pageNumber,
          );
        }

        return [
          ...current,
          pageNumber,
        ];
      },
    );

    setSelectedPage(
      pageNumber,
    );
  }


  function selectAllPages() {

    if (!pdf) {
      return;
    }

    clearMessages();

    setSelectedPages(
      Array.from(
        {
          length: pdf.page_count,
        },
        (_, index) => index + 1,
      ),
    );
  }


  function clearSelection() {

    clearMessages();

    setSelectedPages([]);

  }


  function movePage(
    pageNumber: number,
    direction: -1 | 1,
  ) {

    clearMessages();

    setPageOrder(
      current => {

        const index =
          current.indexOf(
            pageNumber,
          );

        if (index === -1) {
          return current;
        }

        const targetIndex =
          index + direction;

        if (
          targetIndex < 0 ||
          targetIndex >= current.length
        ) {
          return current;
        }

        const next = [
          ...current,
        ];

        [
          next[index],
          next[targetIndex],
        ] = [
          next[targetIndex],
          next[index],
        ];

        return next;

      },
    );

    setSelectedPage(
      pageNumber,
    );
  }


  async function refreshPdf(
    blob: Blob,
  ) {

    const updatedFile =
      new File(
        [blob],
        "modified.pdf",
        {
          type: "application/pdf",
        },
      );

    const updatedPdf =
      await uploadPdf(
        updatedFile,
      );

    setFile(updatedFile);
    setPdf(updatedPdf);

    setSelectedPages([]);

    setOperation(null);

    return updatedPdf;
  }


  async function handleDelete() {

    if (!file) {
      return;
    }

    if (
      selectedPages.length === 0
    ) {
      setError(
        "Select at least one page to delete.",
      );
      return;
    }

    if (
      pdf &&
      selectedPages.length >=
        pdf.page_count
    ) {
      setError(
        "You cannot delete all pages from a PDF.",
      );
      return;
    }

    setProcessing(true);

    clearMessages();

    try {

      const blob =
        await deletePdfPages(
          file,
          selectedPages,
        );

      await refreshPdf(
        blob,
      );

      setSuccess(
        "Selected pages deleted successfully.",
      );

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete pages.",
      );

    } finally {

      setProcessing(false);

    }
  }


  async function handleRotate() {

    if (!file) {
      return;
    }

    if (
      selectedPages.length === 0
    ) {
      setError(
        "Select at least one page to rotate.",
      );
      return;
    }

    setProcessing(true);

    clearMessages();

    try {

      const blob =
        await rotatePdfPages(
          file,
          selectedPages,
          rotation,
        );

      await refreshPdf(
        blob,
      );

      setSuccess(
        `Selected pages rotated by ${rotation}°.`,
      );

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to rotate pages.",
      );

    } finally {

      setProcessing(false);

    }
  }


  async function handleReorder() {

    if (!file || !pdf) {
      return;
    }

    const originalOrder =
      Array.from(
        {
          length: pdf.page_count,
        },
        (_, index) => index + 1,
      );

    const unchanged =
      pageOrder.every(
        (page, index) =>
          page ===
          originalOrder[index],
      );

    if (unchanged) {
      setError(
        "No page order changes were made.",
      );
      return;
    }

    setProcessing(true);

    clearMessages();

    try {

      const blob =
        await reorderPdfPages(
          file,
          pageOrder,
        );

      await refreshPdf(
        blob,
      );

      setSuccess(
        "Page order updated successfully.",
      );

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to reorder pages.",
      );

    } finally {

      setProcessing(false);

    }
  }


  async function handleReset() {

    if (pdf) {

      try {

        await deletePdf(
          pdf.file_id,
        );

      } catch {
        // Ignore cleanup errors.
      }

    }

    setFile(null);
    setPdf(null);
    setSelectedPages([]);
    setPageOrder([]);
    setSelectedPage(1);

    clearMessages();

  }


  if (!pdf) {

    return (
      <div className="mx-auto max-w-4xl">

        <div className="mb-10 text-center">

          <div className="mb-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
            PDF Page Management
          </div>

          <h1 className="text-4xl font-bold tracking-tight text-slate-900">
            Manage PDF Pages
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-slate-600">
            Delete, rotate, and reorder pages
            in your PDF.
          </p>

        </div>


        <PdfDropZone
          disabled={processing}
          onFileSelected={
            handleFileSelected
          }
        />


        {processing && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-center">

            <p className="text-sm font-medium text-slate-700">
              Loading PDF...
            </p>

          </div>
        )}


        {error && (
          <Message
            type="error"
            message={error}
          />
        )}

      </div>
    );

  }


  return (
    <div>

      {/* Header */}

      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-900">
            Page Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            {pdf.filename}
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
          onClick={handleReset}
          disabled={processing}
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Change PDF
        </button>

      </div>


      {error && (
        <Message
          type="error"
          message={error}
        />
      )}


      {success && (
        <Message
          type="success"
          message={success}
        />
      )}


      <div className="grid gap-6 lg:grid-cols-[260px_1fr_280px]">

        {/* Page thumbnails */}

        <aside className="rounded-xl border border-slate-200 bg-white p-3">

          <div className="mb-3 flex items-center justify-between px-2">

            <div>

              <p className="text-sm font-semibold text-slate-900">
                Pages
              </p>

              <p className="text-xs text-slate-500">
                {selectedPages.length}
                {" selected"}
              </p>

            </div>

            <button
              type="button"
              onClick={
                selectedPages.length ===
                pdf.page_count
                  ? clearSelection
                  : selectAllPages
              }
              className="text-xs font-medium text-slate-600 hover:text-slate-900"
            >
              {selectedPages.length ===
              pdf.page_count
                ? "Clear"
                : "Select all"}
            </button>

          </div>


          <div className="grid max-h-[720px] gap-3 overflow-y-auto pr-1">

            {pageOrder.map(
              pageNumber => (

                <div
                  key={pageNumber}
                  className={[
                    "rounded-lg border p-1",
                    selectedPageSet.has(
                      pageNumber,
                    )
                      ? "border-slate-900 bg-slate-100"
                      : "border-transparent",
                  ].join(" ")}
                >

                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                        togglePage(pageNumber)
                    }
                    onKeyDown={event => {

                        if (
                        event.key === "Enter" ||
                        event.key === " "
                        ) {
                        togglePage(pageNumber);
                        }

                    }}
                    className="cursor-pointer"
                    >

                    <PdfPageThumbnail
                        fileId={pdf.file_id}
                        pageNumber={pageNumber}
                        selected={
                        selectedPage === pageNumber
                        }
                        onClick={() =>
                        togglePage(pageNumber)
                        }
                    />

                  </div>

                  <div className="mt-1 flex items-center justify-between px-1">

                    <span className="text-xs font-medium text-slate-500">
                      Page {pageNumber}
                    </span>

                    <div className="flex gap-1">

                      <button
                        type="button"
                        disabled={
                          pageOrder.indexOf(
                            pageNumber,
                          ) === 0
                        }
                        onClick={() =>
                          movePage(
                            pageNumber,
                            -1,
                          )
                        }
                        className="rounded px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-30"
                        title="Move up"
                      >
                        ↑
                      </button>

                      <button
                        type="button"
                        disabled={
                          pageOrder.indexOf(
                            pageNumber,
                          ) ===
                          pageOrder.length - 1
                        }
                        onClick={() =>
                          movePage(
                            pageNumber,
                            1,
                          )
                        }
                        className="rounded px-2 py-1 text-xs hover:bg-slate-100 disabled:opacity-30"
                        title="Move down"
                      >
                        ↓
                      </button>

                    </div>

                  </div>

                </div>

              ),
            )}

          </div>

        </aside>


        {/* Viewer */}

        <div>

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
              setSelectedPage
            }
          />

        </div>


        {/* Controls */}

        <aside className="rounded-xl border border-slate-200 bg-white p-5">

          <h2 className="text-base font-semibold text-slate-900">
            Page Actions
          </h2>

          <p className="mt-1 text-xs text-slate-500">
            Select pages and apply an action.
          </p>


          <div className="mt-6 space-y-5">

            {/* Delete */}

            <section>

              <p className="text-sm font-medium text-slate-800">
                Delete
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Remove selected pages.
              </p>

              <button
                type="button"
                onClick={() => {
                  setOperation(
                    "delete",
                  );
                  handleDelete();
                }}
                disabled={
                  processing ||
                  selectedPages.length === 0
                }
                className="mt-3 w-full rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing &&
                operation ===
                  "delete"
                  ? "Deleting..."
                  : "Delete Pages"}
              </button>

            </section>


            <div className="border-t border-slate-100" />


            {/* Rotate */}

            <section>

              <p className="text-sm font-medium text-slate-800">
                Rotate
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Rotate selected pages clockwise.
              </p>


              <select
                value={rotation}
                onChange={event =>
                  setRotation(
                    Number(
                      event.target.value,
                    ) as
                      | 90
                      | 180
                      | 270,
                  )
                }
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
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
                onClick={() => {
                  setOperation(
                    "rotate",
                  );
                  handleRotate();
                }}
                disabled={
                  processing ||
                  selectedPages.length === 0
                }
                className="mt-2 w-full rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing &&
                operation ===
                  "rotate"
                  ? "Rotating..."
                  : "Rotate Pages"}
              </button>

            </section>


            <div className="border-t border-slate-100" />


            {/* Reorder */}

            <section>

              <p className="text-sm font-medium text-slate-800">
                Reorder
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Use ↑ and ↓ beside each page.
              </p>


              <button
                type="button"
                onClick={() => {
                  setOperation(
                    "reorder",
                  );
                  handleReorder();
                }}
                disabled={
                  processing
                }
                className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {processing &&
                operation ===
                  "reorder"
                  ? "Saving..."
                  : "Apply New Order"}
              </button>

            </section>

          </div>


          {processing && (
            <div className="mt-6 rounded-lg bg-slate-50 px-3 py-2 text-center text-xs text-slate-500">
              Processing PDF...
            </div>
          )}

        </aside>

      </div>

    </div>
  );
}


interface MessageProps {
  type: "error" | "success";
  message: string;
}


function Message({
  type,
  message,
}: MessageProps) {

  return (
    <div
      className={[
        "mb-4 rounded-xl border px-4 py-3 text-sm",
        type === "error"
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700",
      ].join(" ")}
    >
      {message}
    </div>
  );
}