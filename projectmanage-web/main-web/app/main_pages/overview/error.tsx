'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          เกิดข้อผิดพลาด!
        </h2>
        
        <p className="text-gray-600 mb-6">
          ไม่สามารถโหลดข้อมูลโปรเจ็กต์ได้ กรุณาตรวจสอบการเชื่อมต่อกับ Strapi backend
        </p>
        
        <div className="space-y-4">
          <button
            onClick={() => reset()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            ลองใหม่อีกครั้ง
          </button>
          
          <button
            onClick={() => window.location.href = '/'}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium transition-colors duration-200"
          >
            กลับสู่หน้าหลัก
          </button>
        </div>
        
        {error.message && (
          <details className="mt-6 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              รายละเอียดข้อผิดพลาด
            </summary>
            <pre className="mt-2 text-xs bg-gray-100 p-3 rounded border overflow-auto text-red-600">
              {error.message}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
