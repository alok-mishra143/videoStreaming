import { useContext, type JSX } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, AuthContext } from "./context/AuthContext";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import VideoPlayer from "./pages/VideoPlayer";
import { ThemeProvider } from "./components/theme/theme-provider";
import { Toaster } from "./components/ui/sonner";
import { Layout } from "./components/Layout";

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useContext(AuthContext)!;

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center">
        Loading...
      </div>
    );

  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <ThemeProvider defaultTheme="dark">
      <AuthProvider>
        <Router>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/video/:id"
                element={
                  <PrivateRoute>
                    <VideoPlayer />
                  </PrivateRoute>
                }
              />
            </Route>
          </Routes>
          <Toaster />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
