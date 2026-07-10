import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#fcfcfc] text-black px-4">
      <h2 className="text-2xl font-bold mb-2">404 - Page Not Found</h2>
      <p className="text-gray-500 mb-6">The page you are looking for does not exist.</p>
      <Link href="/" className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors">
        Go Back Home
      </Link>
    </div>
  );
}
