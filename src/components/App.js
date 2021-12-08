import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

import { DevLogin } from "./User/DevLogin"
import { DashboardContainer } from "./Dashboard/DashboardContainer"

import { AuthProvider } from "../contexts/Auth"
import { RemoteEventProvider } from "../contexts/RemoteEventProvider"

import { PrivateRoute } from "./Routes/PrivateRoute"

function App() {

  return (
    <div className="App">
      <Router>
          <AuthProvider>
            <RemoteEventProvider>
                
                <Routes>
                  
                  {/* Private Routes */}
                  <Route path='/' element={<PrivateRoute/>}>
                      <Route path='*' element={<DashboardContainer/>} />
                  </Route>
                  
                  {/* Public Routes */}
                  <Route path='/devlogin' element={<DevLogin/>} />
                  
                </Routes>
                
            </RemoteEventProvider>
          </AuthProvider>
      </Router>
    </div>
  );
}

export default App;