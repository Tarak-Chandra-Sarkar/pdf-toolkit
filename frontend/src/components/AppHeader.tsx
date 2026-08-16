interface AppHeaderProps {
  onHome: () => void;
  onMerge: () => void;
  onSplit: () => void;
  onImagesToPdf: () => void;
}


export function AppHeader({
  onHome,
  onMerge,
  onSplit,
  onImagesToPdf,
}: AppHeaderProps) {

  return (
    <header className="border-b border-slate-200 bg-white">

      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

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


        <nav className="flex items-center gap-2">

          <button
            type="button"
            onClick={onHome}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Home
          </button>


          <button
            type="button"
            onClick={onMerge}
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white"
          >
            Merge PDF
          </button>


          <button
            type="button"
            onClick={onSplit}
            className="rounded-lg bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Split PDF
          </button>

          <button
            type="button"
            onClick={onImagesToPdf}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 hover:bg-slate-100"
          >
            Images → PDF
          </button>

          <div className="ml-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
            MVP v1.0
          </div>

        </nav>

      </div>

    </header>
  );
}