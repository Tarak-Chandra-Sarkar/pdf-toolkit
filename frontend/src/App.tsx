import { useState } from "react";

import { AppHeader } from "./components/AppHeader";
import { HomePage } from "./pages/HomePage";
import { MergePage } from "./pages/MergePage";
import { SplitPage } from "./pages/SplitPage";
import { ImagesToPdfPage } from "./pages/ImagesToPdfPage";


type Page =
  | "home"
  | "merge"
  | "split"
  | "images-to-pdf";


function App() {

  const [
    page,
    setPage,
  ] = useState<Page>("home");


  return (
    <div className="min-h-screen bg-slate-50">

      <AppHeader
        activePage={page}

        onHome={() =>
          setPage("home")
        }

        onMerge={() =>
          setPage("merge")
        }

        onSplit={() =>
          setPage("split")
        }

        onImagesToPdf={() =>
          setPage("images-to-pdf")
        }
      />


      <main className="mx-auto max-w-7xl px-6 py-10">

        {page === "home" && (
          <HomePage
            onMerge={() =>
              setPage("merge")
            }

            onSplit={() =>
              setPage("split")
            }
          />
        )}


        {page === "merge" && (
          <MergePage />
        )}


        {page === "split" && (
          <SplitPage />
        )}

        {page === "images-to-pdf" && (
          <ImagesToPdfPage />
        )}

      </main>

    </div>
  );
}


export default App;