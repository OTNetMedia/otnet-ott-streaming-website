import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-32 px-6 text-center">
      <p className="text-xs uppercase tracking-wider text-primary">404</p>
      <h1 className="text-3xl font-bold">Page not found</h1>
      <p className="text-text-secondary">The page you’re looking for doesn’t exist or has moved.</p>
      <Link
        href="/"
        className="mt-2 inline-flex items-center px-4 py-2 rounded-md bg-primary text-white font-semibold hover:bg-primary/90"
      >
        Back to home
      </Link>
    </div>
  );
}
