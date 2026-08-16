import {
  useState,
} from "react";


interface AppHeaderProps {

  onHome: () => void;

  onMerge: () => void;

  onSplit: () => void;

  onImagesToPdf: () => void;

  onPageManagement: () => void;

}


export function AppHeader({
  onHome,
  onMerge,
  onSplit,
  onImagesToPdf,
  onPageManagement,
}: AppHeaderProps) {

  const [
    toolsOpen,
    setToolsOpen,
  ] = useState(false);


  return (
    <header className="border-b border-slate-200 bg-white">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

        {/* Brand */}

        <button
          type="button"
          onClick={onHome}
          className="text-left"
        >

          <h1 className="text-xl font-bold text-slate-900">
            PDF Toolkit
          </h1>

          <p className="text-xs text-slate-500">
            Local PDF utility
          </p>

        </button>


        {/* Navigation */}

        <nav className="flex items-center gap-2">

          <button
            type="button"
            onClick={onHome}
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
          >
            Home
          </button>


          <div className="relative">

            <button
              type="button"
              onClick={() =>
                setToolsOpen(
                  current => !current,
                )
              }
              className={[
                "flex items-center gap-2 rounded-lg",
                "px-4 py-2 text-sm font-medium",
                "text-slate-700 hover:bg-slate-100",
              ].join(" ")}
            >

              Tools

              <span
                className={[
                  "text-xs transition-transform",
                  toolsOpen
                    ? "rotate-180"
                    : "",
                ].join(" ")}
              >
                ▾
              </span>

            </button>


            {toolsOpen && (

              <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border border-slate-200 bg-white p-1 shadow-lg">

                <ToolMenuItem
                  label="Merge PDF"
                  description="Combine PDFs"
                  onClick={() => {
                    setToolsOpen(false);
                    onMerge();
                  }}
                />


                <ToolMenuItem
                  label="Split PDF"
                  description="Split or extract pages"
                  onClick={() => {
                    setToolsOpen(false);
                    onSplit();
                  }}
                />

                <ToolMenuItem
                  label="Images to PDF"
                  description="Images(.png, .jpg) to .pdf"
                  onClick={() => {
                    setToolsOpen(false);
                    onImagesToPdf();
                  }}
                />

                <ToolMenuItem
                  label="Manage Pages"
                  description="Delete, rotate, reorder"
                  onClick={() => {
                    setToolsOpen(false);
                    onPageManagement();
                  }}
                />

              </div>

            )}

          </div>


          <div className="ml-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            MVP v1.0
          </div>

        </nav>

      </div>

    </header>
  );
}


interface ToolMenuItemProps {

  label: string;

  description: string;

  onClick: () => void;

}


function ToolMenuItem({
  label,
  description,
  onClick,
}: ToolMenuItemProps) {

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-lg px-3 py-2 text-left hover:bg-slate-50"
    >

      <div className="text-sm font-medium text-slate-900">
        {label}
      </div>

      <div className="text-xs text-slate-500">
        {description}
      </div>

    </button>
  );
}