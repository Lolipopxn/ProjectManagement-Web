export default function SkeletonCard() {
    return (
        <div className='flex flex-col p-8 w-full border-2 rounded-md border-gray-200 gap-4 col-span-1'>
            <div className='flex flex-row gap-6 items-center'>
                <div className='h-20 w-35 bg-gray-200 rounded-md'></div>
                <div className='flex flex-col w-full h-auto gap-4'>
                    <div className='h-6 w-full bg-gray-200 rounded-md'></div>
                    <div className='h-6 w-full bg-gray-200 rounded-md'></div>
                </div>        
            </div>

            <div className='w-full h-auto flex flex-row justify-between itwms-center gap-2 mt-4'>
                <div className='h-6 w-full bg-gray-200 rounded-md'></div>
                <div className='h-6 w-1/4 bg-gray-200 rounded-md'></div>
            </div>
        </div>
    );
}