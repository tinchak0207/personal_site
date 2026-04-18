import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { AuthProvider } from './contexts/AuthContext';

const Blog = lazy(() => import('./pages/Blog').then(module => ({ default: module.Blog })));
const BlogPost = lazy(() => import('./pages/BlogPost').then(module => ({ default: module.BlogPost })));
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.default || module.Admin })));
const Projects = lazy(() => import('./pages/Projects'));
const Links = lazy(() => import('./pages/Links'));
const Settings = lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-[#030a07] text-[#4ADE80] font-pixel flex items-center justify-center">INITIALIZING NEURAL NET...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/links" element={<Links />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;