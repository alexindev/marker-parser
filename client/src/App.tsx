import { BrowserRouter, Routes, Route } from "react-router-dom";
import { SearchPage, ResultsPage } from "@/pages";
import "@/styles/globals.scss";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SearchPage />} />
        <Route path="/results/:queryId" element={<ResultsPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
