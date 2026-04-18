import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const Home = lazy(() => import('./pages/Home').then(module => ({ default: module.Home })));
const Blog = lazy(() => import('./pages/Blog').then(module => ({ default: module.Blog })));
const BlogPost = lazy(() => import('./pages/BlogPost').then(module => ({ default: module.BlogPost })));
const Admin = lazy(() => import('./pages/Admin').then(module => ({ default: module.Admin })));

function App() {
  return (
    <Router>
      <Suspense fallback={<div className="min-h-screen bg-[#030a07] text-[#4ADE80] font-pixel flex items-center justify-center">INITIALIZING NEURAL NET...</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogPost />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;