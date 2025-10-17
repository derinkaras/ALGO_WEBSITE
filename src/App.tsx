import {Route, Routes} from "react-router-dom";
import Home from "./pages/Home.tsx";
import NavBar from "./components/NavBar.tsx";

function App() {

  return (
      <>
          <NavBar/>
          <Routes>
              <Route index element={<Home/>} />
              <Route path="/home" element={<Home/>}/>
          </Routes>
      </>

  )
}

export default App
