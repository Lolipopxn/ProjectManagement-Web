import SkeletonCard from './skeletonCard';

export default function SkeletonTask() {
    return (
        <div className='flex flex-col item-center p-4 animate-pulse gap-8'>
            {/* header */}
            <div className='h-10 w-full bg-gray-200 rounded-md'></div>

            <div className='grid grid-cols-2 gap-8 w-full'>
              {/* card */}
              {[...Array(4)].map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
        </div>
    );
}