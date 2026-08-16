type Page =
  | "home"
  | "merge"
  | "split"
  | "images-to-pdf";


interface AppHeaderProps {
  activePage: Page;

  onHome: () => void;
  onMerge: () => void;
  onSplit: () => void;
  onImagesToPdf: () => void;
}


export function AppHeader({
  activePage,
  onHome,
  onMerge,
  onSplit,
  onImagesToPdf,
}: AppHeaderProps) {


  const navItemClass = (
    page: Page,
  ) => {

    const isActive =
      activePage === page;


    return [
      "rounded-lg",
      "px-4",
      "py-2.5",
      "text-sm",
      "font-medium",
      "transition-colors",
      "duration-150",

      isActive
        ? [
            "bg-slate-900",
            "text-white",
            "shadow-sm",
          ].join(" ")
        : [
            "text-slate-600",
            "hover:bg-slate-100",
            "hover:text-slate-900",
          ].join(" "),
    ].join(" ");
  };


  return (
    <header className="border-b border-slate-200 bg-white">

      <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">

        {/* Brand */}

        <button
          type="button"
          onClick={onHome}
          className="shrink-0 text-left"
        >

          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            PDF Toolkit
          </h1>

          <p className="text-xs text-slate-500">
            Local PDF utility
          </p>

        </button>


        {/* Navigation */}

        <nav
          className="
            flex
            items-center
            gap-1
            overflow-x-auto
            rounded-xl
            bg-slate-50
            p-1
          "
        >

          <button
            type="button"
            onClick={onHome}
            className={navItemClass("home")}
          >
            Home
          </button>


          <button
            type="button"
            onClick={onMerge}
            className={navItemClass("merge")}
          >
            Merge PDF
          </button>


          <button
            type="button"
            onClick={onSplit}
            className={navItemClass("split")}
          >
            Split PDF
          </button>


          <button
            type="button"
            onClick={onImagesToPdf}
            className={navItemClass(
              "images-to-pdf",
            )}
          >
            Images → PDF
          </button>

        </nav>


        {/* Version */}

        <div
          className="
            hidden
            shrink-0
            rounded-full
            border
            border-slate-200
            bg-white
            px-3
            py-1.5
            text-xs
            font-medium
            text-slate-500
            sm:block
          "
        >
          MVP v1.0
        </div>

      </div>

    </header>
  );
}