export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Skeleton */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-8 bg-gray-300 rounded-md w-64 animate-pulse mb-2"></div>
                <div className="h-4 bg-gray-200 rounded-md w-96 animate-pulse"></div>
              </div>
              <div className="h-12 bg-gray-300 rounded-lg w-40 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gray-300 rounded-md animate-pulse"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse mb-2"></div>
                  <div className="h-6 bg-gray-300 rounded w-12 animate-pulse"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Projects Section Skeleton */}
        <div className="mb-6">
          <div className="h-6 bg-gray-300 rounded w-32 animate-pulse mb-4"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md border border-gray-200">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
                    <div className="h-6 bg-gray-200 rounded-full w-20 animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                  </div>
                  
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-gray-200 rounded w-40 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-44 animate-pulse"></div>
                  </div>
                  
                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                      <div className="h-8 bg-gray-300 rounded w-24 animate-pulse"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
