import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Homepage from "./components/Homepage";
import Game from "./components/Game";
import "./App.css";

function App() {
  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/" element={<Homepage />} />
          <Route path="/game" element={<Game />} />
          <Route path="/game/:lobbyId" element={<Game />} />
          <Route path="/game/:lobbyId/:userName" element={<Game />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
