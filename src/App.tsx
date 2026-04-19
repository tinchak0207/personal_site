import { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';

// Custom lazy function that automatically reloads the page if a chunk fails to load
// This typically happens when a new version of the app is deployed while a user has the site open
const lazyWithRetry = (componentImport: () => Promise<any>) =>
  lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('page-has-been-force-refreshed') || 'false'
    );

    try {
      const component = await componentImport();
      window.sessionStorage.setItem('page-has-been-force-refreshed', 'false');
      return component;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        window.sessionStorage.setItem('page-has-been-force-refreshed', 'true');
        window.location.reload();
      }
      throw error;
    }
  });

const Blog = lazyWithRetry(() => import('./pages/Blog').then(module => ({ default: module.Blog })));
const BlogPost = lazyWithRetry(() => import('./pages/BlogPost').then(module => ({ default: module.BlogPost })));
const Admin = lazyWithRetry(() => import('./pages/Admin').then(module => ({ default: module.Admin })));
const Projects = lazyWithRetry(() => import('./pages/Projects'));
const Timeline = lazyWithRetry(() => import('./pages/Timeline'));
const Links = lazyWithRetry(() => import('./pages/Links'));
const Settings = lazyWithRetry(() => import('./pages/Settings'));

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
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/links" element={<Links />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default App;