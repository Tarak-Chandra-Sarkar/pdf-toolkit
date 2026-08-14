import React, { useRef, useState } from "react";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "http://localhost:8000";

type SplitMode =
  | "split"
  | "extract";


const SplitPage: React.FC = () => {

  const [
    file,
    setFile,
  ] = useState<File | null>(null);


  const [
    mode,
    setMode,
  ] = useState<SplitMode>("split");


  const [
    startPage,
    setStartPage,
  ] = useState("");


  const [
    endPage,
    setEndPage,
  ] = useState("");


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


  const fileInputRef =
    useRef<HTMLInputElement | null>(null);


  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {

    const selectedFile =
      event.target.files?.[0] ?? null;


    setError(null);
    setSuccess(null);


    if (!selectedFile) {
      setFile(null);
      return;
    }


    if (
      !selectedFile.name
        .toLowerCase()
        .endsWith(".pdf")
    ) {

      setError(
        "Please select a PDF file.",
      );

      setFile(null);

      return;
    }


    setFile(selectedFile);
  };


  const handleChooseFile = () => {
    fileInputRef.current?.click();
  };


  const handleModeChange = (
    newMode: SplitMode,
  ) => {

    setMode(newMode);

    setError(null);
    setSuccess(null);


    if (newMode === "split") {

      setStartPage("");
      setEndPage("");

    }
  };


  const downloadBlob = (
    blob: Blob,
    filename: string,
  ) => {

    const url =
      window.URL.createObjectURL(blob);


    const link =
      document.createElement("a");


    link.href = url;
    link.download = filename;


    document.body.appendChild(link);

    link.click();

    link.remove();


    window.URL.revokeObjectURL(url);
  };


  const handleSubmit = async () => {

    setError(null);
    setSuccess(null);


    if (!file) {

      setError(
        "Please select a PDF file.",
      );

      return;
    }


    if (mode === "extract") {

      const start =
        Number(startPage);

      const end =
        Number(endPage);


      if (
        !Number.isInteger(start) ||
        start < 1
      ) {

        setError(
          "Start page must be a positive integer.",
        );

        return;
      }


      if (
        !Number.isInteger(end) ||
        end < 1
      ) {

        setError(
          "End page must be a positive integer.",
        );

        return;
      }


      if (start > end) {

        setError(
          "Start page must not be greater than end page.",
        );

        return;
      }
    }


    setIsProcessing(true);


    try {

      const formData =
        new FormData();


      formData.append(
        "file",
        file,
      );


      let endpoint =
        `${API_BASE_URL}/api/v1/pdf/split`;


      if (mode === "extract") {

        endpoint =
          `${API_BASE_URL}/api/v1/pdf/extract`;


        formData.append(
          "start_page",
          startPage,
        );


        formData.append(
          "end_page",
          endPage,
        );
      }


      const response =
        await fetch(
          endpoint,
          {
            method: "POST",
            body: formData,
          },
        );


      if (!response.ok) {

        let message =
          "Unable to process PDF.";


        try {

          const data =
            await response.json();


          if (data?.detail) {
            message = data.detail;
          }

        } catch {
          // Ignore JSON parsing errors.
        }


        throw new Error(message);
      }


      const blob =
        await response.blob();


      const contentDisposition =
        response.headers.get(
          "Content-Disposition",
        );


      let filename =
        mode === "split"
          ? "split_pdf.zip"
          : `extracted_${startPage}-${endPage}.pdf`;


      if (contentDisposition) {

        const match =
          contentDisposition.match(
            /filename="?([^"]+)"?/i,
          );


        if (match?.[1]) {
          filename = match[1];
        }
      }


      downloadBlob(
        blob,
        filename,
      );


      setSuccess(
        mode === "split"
          ? "PDF split successfully."
          : "Pages extracted successfully.",
      );

    } catch (err) {

      setError(
        err instanceof Error
          ? err.message
          : "Unable to process PDF.",
      );

    } finally {

      setIsProcessing(false);

    }
  };


  return (
    <div className="mx-auto max-w-4xl">

      {/* Header */}

      <div className="mb-8">

        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Split PDF
        </h1>


        <p className="mt-2 text-slate-600">
          Split a PDF into individual pages
          or extract a specific page range.
        </p>

      </div>


      {/* Main Card */}

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">


        {/* File Selection */}

        <div className="border-b border-slate-200 p-6">

          <div className="mb-4">

            <h2 className="text-base font-semibold text-slate-900">
              PDF File
            </h2>

            <p className="mt-1 text-sm text-slate-500">
              Select the PDF you want to split.
            </p>

          </div>


          <input
            ref={fileInputRef}
            id="pdf-file"
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />


          {!file ? (

            <button
              type="button"
              onClick={handleChooseFile}
              className="w-full rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center transition hover:border-slate-400 hover:bg-slate-100"
            >

              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white text-2xl shadow-sm">
                📄
              </div>


              <p className="mt-4 text-sm font-semibold text-slate-900">
                Select a PDF file
              </p>


              <p className="mt-1 text-sm text-slate-500">
                Click here to browse your computer
              </p>


              <span className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white">
                Choose PDF
              </span>

            </button>

          ) : (

            <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex min-w-0 items-center gap-4">

                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white text-xl shadow-sm">
                  📄
                </div>


                <div className="min-w-0">

                  <p className="truncate text-sm font-semibold text-slate-900">
                    {file.name}
                  </p>


                  <p className="mt-1 text-xs text-slate-500">
                    {(
                      file.size /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </p>

                </div>

              </div>


              <button
                type="button"
                onClick={handleChooseFile}
                className="shrink-0 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
              >
                Change PDF
              </button>

            </div>

          )}

        </div>


        {/* Split Mode */}

        <div className="p-6">

          <div className="mb-4">

            <h2 className="text-base font-semibold text-slate-900">
              Split Mode
            </h2>


            <p className="mt-1 text-sm text-slate-500">
              Choose how you want to process the PDF.
            </p>

          </div>


          <div className="grid gap-4 md:grid-cols-2">


            {/* Split Every Page */}

            <button
              type="button"
              onClick={() =>
                handleModeChange("split")
              }
              className={[
                "rounded-xl border-2 p-5 text-left transition",
                mode === "split"
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white hover:border-slate-300",
              ].join(" ")}
            >

              <div className="flex items-start gap-4">

                <div
                  className={[
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    mode === "split"
                      ? "border-slate-900"
                      : "border-slate-300",
                  ].join(" ")}
                >

                  {mode === "split" && (
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                  )}

                </div>


                <div>

                  <h3 className="font-semibold text-slate-900">
                    Split every page
                  </h3>


                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Creates one PDF file per page
                    inside a ZIP file.
                  </p>

                </div>

              </div>

            </button>


            {/* Extract Range */}

            <button
              type="button"
              onClick={() =>
                handleModeChange("extract")
              }
              className={[
                "rounded-xl border-2 p-5 text-left transition",
                mode === "extract"
                  ? "border-slate-900 bg-slate-50"
                  : "border-slate-200 bg-white hover:border-slate-300",
              ].join(" ")}
            >

              <div className="flex items-start gap-4">

                <div
                  className={[
                    "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                    mode === "extract"
                      ? "border-slate-900"
                      : "border-slate-300",
                  ].join(" ")}
                >

                  {mode === "extract" && (
                    <div className="h-2.5 w-2.5 rounded-full bg-slate-900" />
                  )}

                </div>


                <div>

                  <h3 className="font-semibold text-slate-900">
                    Extract page range
                  </h3>


                  <p className="mt-1 text-sm leading-6 text-slate-500">
                    Creates one PDF containing
                    the selected pages.
                  </p>

                </div>

              </div>

            </button>

          </div>


          {/* Page Range */}

          {mode === "extract" && (

            <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50 p-5">

              <div className="mb-4">

                <h3 className="text-sm font-semibold text-slate-900">
                  Page Range
                </h3>

                <p className="mt-1 text-xs text-slate-500">
                  Enter the first and last page
                  to extract.
                </p>

              </div>


              <div className="grid gap-4 sm:grid-cols-2">

                <div>

                  <label
                    htmlFor="start-page"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    Start Page
                  </label>


                  <input
                    id="start-page"
                    type="number"
                    min="1"
                    value={startPage}
                    onChange={(event) =>
                      setStartPage(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 3"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />

                </div>


                <div>

                  <label
                    htmlFor="end-page"
                    className="mb-2 block text-sm font-medium text-slate-700"
                  >
                    End Page
                  </label>


                  <input
                    id="end-page"
                    type="number"
                    min="1"
                    value={endPage}
                    onChange={(event) =>
                      setEndPage(
                        event.target.value,
                      )
                    }
                    placeholder="e.g. 7"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
                  />

                </div>

              </div>

            </div>

          )}


          {/* Messages */}

          {error && (

            <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>

          )}


          {success && (

            <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {success}
            </div>

          )}


          {/* Action */}

          <div className="mt-6 flex justify-end">

            <button
              type="button"
              disabled={
                !file ||
                isProcessing
              }
              onClick={handleSubmit}
              className="rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300"
            >

              {isProcessing
                ? "Processing..."
                : mode === "split"
                  ? "Split PDF"
                  : "Extract Pages"}

            </button>

          </div>

        </div>

      </div>

    </div>
  );
};


export { SplitPage };