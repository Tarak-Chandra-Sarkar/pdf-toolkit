import { useState } from "react";

import { AppHeader } from "./components/AppHeader";
import { HomePage } from "./pages/HomePage";
import { MergePage } from "./pages/MergePage";
import { SplitPage } from "./pages/SplitPage";


type Page =
  | "home"
  | "merge"
  | "split";


function App() {

  const [
    page,
    setPage,
  ] = useState<Page>("home");


  return (
    <div className="min-h-screen bg-slate-50">

      <AppHeader
        onHome={() =>
          setPage("home")
        }

        onMerge={() =>
          setPage("merge")
        }

        onSplit={() =>
          setPage("split")
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

      </main>

    </div>
  );
}


export default App;