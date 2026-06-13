import { Link } from 'react-router-dom';
import Logo from '../components/Logo';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-[#FAF6EE] flex items-center justify-center p-6 text-center">
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&display=swap');`}</style>
      <div>
        <div className="flex justify-center mb-6">
          <Logo size={64} withText={false} />
        </div>
        <p className="text-[#D4A857] text-sm font-semibold tracking-[0.3em] uppercase mb-2">
          Error 404
        </p>
        <h1
          className="text-5xl font-bold text-[#1C2541] mb-4"
          style={{ fontFamily: "'Fraunces', Georgia, serif" }}
        >
          Page Not Found
        </h1>
        <p className="text-[#6B7785] max-w-md mx-auto mb-8">
          The page you're looking for doesn't exist or may have been moved.
        </p>
        <Link
          to="/"
          className="bg-[#1C2541] text-[#FAF6EE] px-8 py-3 rounded-full font-bold hover:bg-[#2a3a63] transition inline-block"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}