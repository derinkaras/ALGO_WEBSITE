import {Route, Routes} from "react-router-dom";
import Home from "./pages/Home.tsx";
import NavBar from "./components/NavBar.tsx";
import Nba from "./pages/Nba.tsx";
import Mlb from "./pages/Mlb.tsx";

function App() {

  return (
      <div className="bg-brand-gray text-white min-h-screen min-w-full">
          <NavBar/>
          <Routes>
              <Route index element={<Home/>} />
              <Route path="/home" element={<Home/>}/>
              <Route path="/nba" element={<Nba/>} />
              <Route path="/mlb" element={<Mlb/>} />
          </Routes>
      </div>

  )
}

export default App
