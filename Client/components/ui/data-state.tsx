"use client"

interface DataLoadingProps {
  message?: string;
}

export function DataLoading({ message = "Loading data..." }: DataLoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
      <h2 className="text-xl font-semibold text-gray-700">{message}</h2>
      <p className="text-gray-500 mt-2">Please wait while we fetch the data</p>
    </div>
  );
}

interface DataErrorProps {
  message?: string;
  details?: string;
}

export function DataError({ 
  message = "Unable to load data", 
  details 
}: DataErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-12 w-12 text-red-500 mx-auto" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-red-600 mb-2">{message}</h2>
      {details && (
        <p className="text-gray-600 max-w-md px-4">{details}</p>
      )}
      <button 
        onClick={() => window.location.reload()}
        className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-primary-600 transition-colors"
      >
        Try Again
      </button>
    </div>
  );
}

export function DataEmpty({ 
  message = "No data found", 
  description 
}: DataLoadingProps & { description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-6">
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className="h-12 w-12 text-gray-400 mx-auto" 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth={2} 
            d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" 
          />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-700 mb-2">{message}</h2>
      {description && (
        <p className="text-gray-500 max-w-md px-4">{description}</p>
      )}
    </div>
  );
}
