
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AuthSuccess from './pages/AuthSuccess';
import Home from './pages/Home';
import Generator from './pages/Generator';
import Contributors from './pages/Contributors';

function App() {
  return (
   
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/success" element={<AuthSuccess />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          } />
          <Route path="/generator" element={
            <ProtectedRoute>
              <Generator />
            </ProtectedRoute>
          } />
          <Route path="/contributors" element={
            <ProtectedRoute>
              <Contributors />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
      
  );
}

export default App;