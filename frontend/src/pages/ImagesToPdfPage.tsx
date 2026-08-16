import React, {
  useRef,
  useState,
} from "react";

import {
  convertImagesToPdf,
} from "../services/api";


const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
];


export const ImagesToPdfPage: React.FC = () => {

  const fileInputRef =
    useRef<HTMLInputElement | null>(null);

  const [
    files,
    setFiles,
  ] = useState<File[]>([]);

  const [
    isProcessing,
    setIsProcessing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState<string | null>(null);

  const [
    success,
    setSuccess,
  ] = useState<string | null>(null);


  const addFiles = (
    selectedFiles: File[],
  ) => {

    setError(null);
    setSuccess(null);

    const invalidFiles =
      selectedFiles.filter(
        (file) =>
          !ALLOWED_TYPES.includes(
            file.type,
          ),
      );

    if (invalidFiles.length > 0) {

      setError(
        "Only JPG, JPEG, and PNG images are supported.",
      );

      return;
    }


    setFiles((current) => [
      ...current,
      ...selectedFiles,
    ]);
  };


  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {

    const selected =
      Array.from(
        event.target.files ?? [],
      );

    addFiles(selected);

    event.target.value = "";
  };


  const removeFile = (
    index: number,
  ) => {

    setFiles((current) =>
      current.filter(
        (_, i) => i !== index,
      ),
    );

    setError(null);
    setSuccess(null);
  };


  const moveFile = (
    index: number,
    direction: "up" | "down",
  ) => {

    setFiles((current) => {

      const newFiles = [
        ...current,
      ];

      const targetIndex =
        direction === "up"
          ? index - 1
          : index + 1;

      if (
        targetIndex < 0 ||
        targetIndex >= newFiles.length
      ) {
        return current;
      }

      [
        newFiles[index],
        newFiles[targetIndex],
      ] = [
        newFiles[targetIndex],
        newFiles[index],
      ];

      return newFiles;
    });
  };


  const downloadBlob = (
    blob: Blob,
    filename: string,
  ) => {

    const url =
      window.URL.createObjectURL(
        blob,
      );

    const link =
      document.createElement("a");

    link.href = url;
    link.download = filename;

    document.body.appendChild(link);

    link.click();

    link.remove();

    window.URL.revokeObjectURL(url);
  };


  const handleConvert = async () => {

    setError(null);
    setSuccess(null);


    if (files.length === 0) {

      setError(
        "Please select at least one image.",
      );

      return;
    }


    setIsProcessing(true);


    try {

      const blob =
        await convertImagesToPdf(
          files,
        );

      downloadBlob(
        blob,
        "images_to_pdf.pdf",
      );

      setSuccess(
        "Images converted to PDF successfully.",
      );

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to convert images to PDF.",
      );

    } finally {

      setIsProcessing(false);
    }
  };


  return (
    <div className="mx-auto max-w-4xl">

      <div className="mb-8">

        <h1 className="text-3xl font-bold text-slate-900">
          Images → PDF
        </h1>

        <p className="mt-2 text-slate-600">
          Convert multiple JPG, JPEG, or PNG
          images into a single PDF.
        </p>

      </div>


      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">

        <div
          className="cursor-pointer rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-10 text-center hover:border-slate-400"
          onClick={() =>
            fileInputRef.current?.click()
          }
        >

          <div className="text-4xl">
            🖼️
          </div>

          <p className="mt-3 font-medium text-slate-900">
            Drop images here
          </p>

          <p className="mt-1 text-sm text-slate-500">
            JPG, JPEG, and PNG
          </p>

          <button
            type="button"
            className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
            onClick={(event) => {
              event.stopPropagation();
              fileInputRef.current?.click();
            }}
          >
            Browse Images
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />

        </div>


        {files.length > 0 && (

          <div className="mt-8">

            <div className="mb-3 flex items-center justify-between">

              <div>

                <h2 className="font-semibold text-slate-900">
                  Selected Images
                </h2>

                <p className="text-xs text-slate-500">
                  {files.length}{" "}
                  {files.length === 1
                    ? "image"
                    : "images"}
                </p>

              </div>

            </div>


            <div className="space-y-3">

              {files.map(
                (file, index) => (

                  <div
                    key={`${file.name}-${index}`}
                    className="flex items-center gap-3 rounded-lg border border-slate-200 p-3"
                  >

                    <div className="text-slate-400">
                      ☰
                    </div>


                    <img
                      src={URL.createObjectURL(file)}
                      alt={file.name}
                      className="h-14 w-14 rounded-md object-cover"
                    />


                    <div className="min-w-0 flex-1">

                      <p className="truncate text-sm font-medium text-slate-900">
                        {file.name}
                      </p>

                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)}
                        {" MB"}
                      </p>

                    </div>


                    <div className="flex gap-1">

                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() =>
                          moveFile(
                            index,
                            "up",
                          )
                        }
                        className="rounded-md border border-slate-200 px-2 py-1 text-sm disabled:opacity-30"
                      >
                        ↑
                      </button>


                      <button
                        type="button"
                        disabled={
                          index ===
                          files.length - 1
                        }
                        onClick={() =>
                          moveFile(
                            index,
                            "down",
                          )
                        }
                        className="rounded-md border border-slate-200 px-2 py-1 text-sm disabled:opacity-30"
                      >
                        ↓
                      </button>


                      <button
                        type="button"
                        onClick={() =>
                          removeFile(index)
                        }
                        className="rounded-md border border-red-200 px-2 py-1 text-sm text-red-600"
                      >
                        Remove
                      </button>

                    </div>

                  </div>

                ),
              )}

            </div>


            {error && (

              <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>

            )}


            {success && (

              <div className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {success}
              </div>

            )}


            <div className="mt-6 flex justify-end">

              <button
                type="button"
                disabled={
                  files.length === 0 ||
                  isProcessing
                }
                onClick={handleConvert}
                className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isProcessing
                  ? "Converting..."
                  : "Convert to PDF"}
              </button>

            </div>

          </div>

        )}

      </div>

    </div>
  );
};