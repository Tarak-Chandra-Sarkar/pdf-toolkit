import {
  type DragEvent,
  useRef,
  useState,
} from "react";


interface PdfDropZoneProps {
  disabled?: boolean;

  onFileSelected: (
    file: File,
  ) => void;
}


export function PdfDropZone({
  disabled = false,
  onFileSelected,
}: PdfDropZoneProps) {

  const inputRef =
    useRef<HTMLInputElement>(null);

  const [dragging, setDragging] =
    useState(false);


  function handleFile(
    file: File | undefined,
  ) {

    if (!file || disabled) {
      return;
    }

    const isPdf =
      file.type ===
        "application/pdf" ||
      file.name
        .toLowerCase()
        .endsWith(".pdf");

    if (!isPdf) {
      return;
    }

    onFileSelected(file);
  }


  function handleDrop(
    event: DragEvent<HTMLDivElement>,
  ) {

    event.preventDefault();

    setDragging(false);

    if (disabled) {
      return;
    }

    handleFile(
      event.dataTransfer.files[0],
    );
  }


  return (
    <div
      onDragOver={(event) => {

        event.preventDefault();

        if (!disabled) {
          setDragging(true);
        }

      }}

      onDragLeave={() => {
        setDragging(false);
      }}

      onDrop={handleDrop}

      onClick={() => {

        if (!disabled) {
          inputRef.current?.click();
        }

      }}

      className={[
        "rounded-2xl border-2 border-dashed",
        "p-12 text-center transition",
        dragging
          ? "border-slate-900 bg-slate-100"
          : "border-slate-300 bg-white",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "cursor-pointer",
      ].join(" ")}
    >

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,.pdf"
        className="hidden"
        disabled={disabled}

        onChange={(event) => {

          handleFile(
            event.target.files?.[0],
          );

          event.target.value = "";
        }}
      />


      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
        📄
      </div>


      <h3 className="mt-5 text-lg font-semibold text-slate-900">
        Drop your PDF here
      </h3>


      <p className="mt-2 text-sm text-slate-500">
        or click to browse your files
      </p>


      <p className="mt-4 text-xs text-slate-400">
        PDF files only • Maximum 50 MB
      </p>

    </div>
  );
}