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
  getHealth,
  uploadPdf,
} from "../services/api";

import type {
  PdfInfo,
} from "../types/api";


type BackendStatus =
  | "checking"
  | "online"
  | "offline";


interface HomePageProps {
  onMerge: () => void;
  onSplit: () => void;
}


export function HomePage({
  onMerge,
  onSplit,
}: HomePageProps) {

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


  const [
    selectedPage,
    setSelectedPage,
  ] = useState(1);


  const [
    uploading,
    setUploading,
  ] = useState(false);


  const [
    error,
    setError,
  ] = useState<string | null>(
    null,
  );


  useEffect(() => {

    let mounted = true;


    async function checkBackend() {

      try {

        await getHealth();

        if (mounted) {
          setBackendStatus(
            "online",
          );
        }

      } catch {

        if (mounted) {
          setBackendStatus(
            "offline",
          );
        }

      }

    }


    checkBackend();


    return () => {
      mounted = false;
    };

  }, []);


  async function handleFileSelected(
    file: File,
  ) {

    setError(null);
    setUploading(true);


    try {

      const uploadedPdf =
        await uploadPdf(file);

      setPdf(uploadedPdf);

      setSelectedPage(1);

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


  async function handleReset() {

    if (!pdf) {
      return;
    }


    try {

      await deletePdf(
        pdf.file_id,
      );

    } catch {
      // Ignore cleanup errors for MVP.
    }


    setPdf(null);
    setSelectedPage(1);
    setError(null);
  }


  if (pdf) {

    return (
      <PdfWorkspace
        pdf={pdf}
        selectedPage={
          selectedPage
        }
        error={error}
        onPageChange={
          setSelectedPage
        }
        onReset={handleReset}
      />
    );

  }


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
      onMerge={onMerge}
      onSplit={onSplit}
    />
  );
}


interface UploadWorkspaceProps {
  uploading: boolean;
  error: string | null;
  backendStatus: BackendStatus;

  onFileSelected: (
    file: File,
  ) => void;

  onMerge: () => void;
  onSplit: () => void;
}


function UploadWorkspace({
  uploading,
  error,
  backendStatus,
  onFileSelected,
  onMerge,
  onSplit,
}: UploadWorkspaceProps) {

  return (
    <div className="mx-auto max-w-3xl">

      <div className="mb-10 text-center">

        <div className="mb-5 inline-flex rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 shadow-sm">
          🔒 Local-first PDF processing
        </div>


        <h1 className="text-4xl font-bold tracking-tight text-slate-900">
          Work with your PDF
        </h1>


        <p className="mx-auto mt-4 max-w-xl text-slate-600">
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

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4 text-center">

          <p className="text-sm font-medium text-slate-700">
            Uploading and inspecting PDF...
          </p>

        </div>

      )}


      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      {/* PDF Tools */}

      <div className="mt-8">

        <div className="mb-4">

          <h2 className="text-lg font-semibold text-slate-900">
            PDF Tools
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Choose a PDF operation to get started.
          </p>

        </div>


        <div className="grid gap-4 sm:grid-cols-2">

          <button
            type="button"
            onClick={onMerge}
            className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >

            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl">
              📄
            </div>

            <h3 className="font-semibold text-slate-900">
              Merge PDF
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Combine multiple PDF files into one
              document.
            </p>

          </button>


          <button
            type="button"
            onClick={onSplit}
            className="group rounded-xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-slate-300 hover:shadow-md"
          >

            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-xl">
              ✂️
            </div>

            <h3 className="font-semibold text-slate-900">
              Split PDF
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              Split every page or extract a
              specific page range.
            </p>

          </button>

        </div>

      </div>


      {/* Backend Status */}

      <div className="mt-8 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-5 py-4">

        <div>

          <p className="text-sm font-medium text-slate-900">
            Backend
          </p>

          <p className="text-xs text-slate-500">
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


interface PdfWorkspaceProps {
  pdf: PdfInfo;
  selectedPage: number;
  error: string | null;

  onPageChange: (
    pageNumber: number,
  ) => void;

  onReset: () => void;
}


function PdfWorkspace({
  pdf,
  selectedPage,
  error,
  onPageChange,
  onReset,
}: PdfWorkspaceProps) {

  return (
    <div>

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-bold text-slate-900">
            {pdf.filename}
          </h1>

          <p className="mt-1 text-sm text-slate-500">
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
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Remove PDF
        </button>

      </div>


      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}


      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">

        <aside className="rounded-xl border border-slate-200 bg-white p-3">

          <div className="mb-3 px-2">

            <p className="text-sm font-semibold text-slate-900">
              Pages
            </p>

            <p className="text-xs text-slate-500">
              {pdf.page_count} pages
            </p>

          </div>


          <div className="grid max-h-[720px] gap-3 overflow-y-auto pr-1">

            {Array.from(
              {
                length:
                  pdf.page_count,
              },
              (_, index) => {

                const pageNumber =
                  index + 1;

                return (
                  <PdfPageThumbnail
                    key={
                      pageNumber
                    }
                    fileId={
                      pdf.file_id
                    }
                    pageNumber={
                      pageNumber
                    }
                    selected={
                      selectedPage ===
                      pageNumber
                    }
                    onClick={() =>
                      onPageChange(
                        pageNumber,
                      )
                    }
                  />
                );
              },
            )}

          </div>

        </aside>


        <PdfViewer
          fileId={pdf.file_id}
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

    </div>
  );
}


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