import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 flex flex-col items-center justify-center text-center">
      <div className="max-w-md">
        {/* Use the Navbar logo */}
        <Image
          src="/Navbar_logo.png" // Use the logo from the public folder
          alt="Ninja Punk Girls Logo"
          width={150} // Adjust width as needed
          height={150} // Adjust height (maintain aspect ratio or set specific size)
          className="mx-auto mb-8 opacity-80" // Adjusted margin
        />
        {/* Removed inline SVG */}
        {/* <svg xmlns="http://www.w3.org/2000/svg" className="h-20 w-20 mx-auto mb-6 text-pink-500 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v.01M12 8v.01M12 12v.01M12 16v.01M4 12h.01M8 12h.01M16 12h.01M20 12h.01" />
        </svg> */}

        <h1 className="text-6xl font-bold text-pink-500 mb-4 tracking-tighter">404</h1>
        <h2 className="text-2xl font-semibold text-teal-400 mb-6">Lost in Neo-Kyoto?</h2>
        <p className="text-gray-400 mb-8">
          Seems like you took a wrong turn in the digital alleyways. The page you're looking for doesn't exist or has been moved to a different sector.
        </p>
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white font-semibold rounded-md transition-colors shadow-lg"
        >
          Return to Base (Home)
        </Link>
      </div>
    </div>
  );
} 