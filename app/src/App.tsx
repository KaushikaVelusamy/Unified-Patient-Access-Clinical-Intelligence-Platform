import { Routes, Route } from 'react-router-dom';
import './App.css';

function App() {
  return (
    <div className="app">
      <Routes>
        {/* Default route - redirect to home */}
        <Route path="/" element={<HomePage />} />

        {/* 404 Not Found */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </div>
  );
}

// Placeholder home page component
function HomePage() {
  return (
    <div className="page-container">
      <header>
        <h1>Clinical Appointment Platform</h1>
        <p>React 18.2 + TypeScript + Vite + React Router v6</p>
      </header>
      <main>
        <section>
          <h2>🚀 Project Setup Complete</h2>
          <ul>
            <li>✅ React with TypeScript</li>
            <li>✅ React Router v6 configured</li>
            <li>✅ ESLint & Prettier configured</li>
            <li>✅ Path aliases setup</li>
            <li>✅ Environment configuration ready</li>
            <li>✅ IIS deployment support enabled</li>
          </ul>
        </section>
        <section>
          <h3>Next Steps</h3>
          <p>
            Start building your pages in <code>src/pages/</code>
          </p>
          <p>
            Create reusable components in <code>src/components/</code>
          </p>
        </section>
      </main>
    </div>
  );
}

// Placeholder 404 page
function NotFoundPage() {
  return (
    <div className="page-container">
      <h1>404 - Page Not Found</h1>
      <p>The page you are looking for does not exist.</p>
      <a href="/">Return to Home</a>
    </div>
  );
}

export default App;
