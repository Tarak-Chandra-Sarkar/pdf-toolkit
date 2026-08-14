import {
  useState,
} from "react";

import {
  mergePdfs,
  getPdfDownloadUrl,
} from "../services/api";

import {
  PdfDropZone,
} from "../components/PdfDropZone";

import type {
  PdfInfo,
} from "../types/api";


export function MergePage() {

  const [
    files,
    setFiles,
  ] = useState<File[]>([]);


  const [
    result,
    setResult,
  ] = useState<PdfInfo | null>(
    null,
  );


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


  function addFile(
    file: File,
  ) {

    setError(null);
    setResult(null);

    setFiles(
      current => [
        ...current,
        file,
      ],
    );
  }


  function removeFile(
    index: number,
  ) {

    setFiles(
      current =>
        current.filter(
          (_, i) =>
            i !== index,
        ),
    );

    setResult(null);
  }


  function moveFile(
    index: number,
    direction: -1 | 1,
  ) {

    const newIndex =
      index + direction;

    if (
      newIndex < 0 ||
      newIndex >= files.length
    ) {
      return;
    }


    const updated = [
      ...files,
    ];


    const [
      movedFile,
    ] = updated.splice(
      index,
      1,
    );


    updated.splice(
      newIndex,
      0,
      movedFile,
    );


    setFiles(updated);
    setResult(null);
  }


  async function handleMerge() {

    if (files.length < 2) {

      setError(
        "Select at least two PDF files.",
      );

      return;
    }


    setProcessing(true);
    setError(null);
    setResult(null);


    try {

      const merged =
        await mergePdfs(files);

      setResult(merged);

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to merge PDFs.",
      );

    } finally {

      setProcessing(false);

    }
  }


  return (
    <div className="mx-auto max-w-4xl">

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-900">
          Merge PDFs
        </h1>

        <p className="mt-2 text-slate-600">
          Combine multiple PDF files into
          one document.
        </p>

      </div>


      <PdfDropZone
        disabled={processing}
        onFileSelected={addFile}
      />


      {files.length > 0 && (

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">

          <div className="mb-4 flex items-center justify-between">

            <div>

              <h2 className="font-semibold text-slate-900">
                Files
              </h2>

              <p className="text-xs text-slate-500">
                {files.length} files
              </p>

            </div>

          </div>


          <div className="space-y-2">

            {files.map(
              (file, index) => (

                <div
                  key={`${file.name}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-slate-200 px-4 py-3"
                >

                  <span className="text-slate-400">
                    ☰
                  </span>


                  <div className="min-w-0 flex-1">

                    <p className="truncate text-sm font-medium text-slate-900">
                      {file.name}
                    </p>

                    <p className="text-xs text-slate-500">
                      {formatBytes(
                        file.size,
                      )}
                    </p>

                  </div>


                  <button
                    type="button"
                    disabled={
                      index === 0 ||
                      processing
                    }
                    onClick={() =>
                      moveFile(
                        index,
                        -1,
                      )
                    }
                    className="rounded px-2 py-1 text-xs disabled:opacity-30"
                  >
                    ↑
                  </button>


                  <button
                    type="button"
                    disabled={
                      index ===
                        files.length - 1 ||
                      processing
                    }
                    onClick={() =>
                      moveFile(
                        index,
                        1,
                      )
                    }
                    className="rounded px-2 py-1 text-xs disabled:opacity-30"
                  >
                    ↓
                  </button>


                  <button
                    type="button"
                    disabled={
                      processing
                    }
                    onClick={() =>
                      removeFile(
                        index,
                      )
                    }
                    className="rounded-lg px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
                  >
                    Remove
                  </button>

                </div>
              ),
            )}

          </div>


          <div className="mt-5 flex justify-end">

            <button
              type="button"
              disabled={
                processing ||
                files.length < 2
              }
              onClick={
                handleMerge
              }
              className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              {processing
                ? "Merging..."
                : "Merge PDFs"}
            </button>

          </div>

        </div>
      )}


      {error && (

        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>

      )}


      {result && (

        <div className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 p-5">

          <h2 className="font-semibold text-emerald-900">
            PDF merged successfully
          </h2>

          <p className="mt-1 text-sm text-emerald-700">
            {result.page_count} pages •{" "}
            {formatBytes(
              result.size_bytes,
            )}
          </p>


          <a
            href={getPdfDownloadUrl(
              result.file_id,
            )}
            download="merged.pdf"
            className="mt-4 inline-block rounded-lg bg-emerald-700 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Download merged PDF
          </a>

        </div>

      )}

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