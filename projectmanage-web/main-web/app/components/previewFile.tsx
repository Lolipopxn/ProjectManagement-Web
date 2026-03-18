import { useState } from "react";
import { IoMdClose } from "react-icons/io";
import { MdCircle } from "react-icons/md";

type PreviewFileProps = {
  isOpenFile: boolean;
  setOpenFile: React.Dispatch<React.SetStateAction<boolean>>;
  previewFile: string | null;
  setPreviewFile: React.Dispatch<React.SetStateAction<string | null>>;
};

export default function PreviewFile({ isOpenFile, setOpenFile, setPreviewFile, previewFile}: PreviewFileProps) {

    const FilePreview = ({ fileUrl }: { fileUrl: string }) => {
        const [error, setError] = useState(false);

        if (!fileUrl || error) {
            return (
            <div className="flex flex-col items-center justify-center h-full">
                <p className="text-gray-500 mb-2">ไม่พบไฟล์ หรือไฟล์ถูกลบ</p>
            </div>
            );
        }

        const ext = fileUrl.split(".").pop()?.toLowerCase();
    
            if (ext === "pdf") {
                return (
                    <iframe
                    src={fileUrl}
                    className="w-full h-full rounded-lg"
                    title="PDF Preview"
                    onError={() => setError(true)}
                    />
                );
                }
    
            if (["jpg", "jpeg", "png", "gif", "webp"].includes(ext || "")) {
                return (
                    <div className="w-full h-full flex items-center justify-center overflow-hidden">
                        <img
                            src={fileUrl}
                            alt="preview"
                            className="max-w-full max-h-full object-contain"
                            onError={() => setError(true)}
                        />
                    </div>
                );
            }

            if (["doc", "docx"].includes(ext || "")) {
                return (
                    <iframe
                    src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(fileUrl)}`}
                    className="w-full h-full rounded-lg"
                    title="Word Preview"
                    onError={() => setError(true)}
                    />
                );
            }
    
            return (
                <div className="flex flex-col items-center justify-center h-full">
                    <p className="text-gray-500 mb-2 dark:text-gray-200">ไม่รองรับ preview ไฟล์นี้</p>
                    <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                    >
                    ดาวน์โหลดไฟล์
                    </a>
                </div>
                );
        };

    return (
        <div className={`fixed inset-0 flex justify-center items-center z-50 transition-all delay-75 duration-400
            ${isOpenFile ? 'opacity-100 scale-100' : 'opacity-0 scale-0 pointer-events-none'}
        `}>    
             <div className='relative flex flex-col w-[95%] h-[95%] mx-auto p-2 bg-white rounded-lg dark:bg-gray-700'>
                <div className='flex flex-row items-center justify-between py-1 px-2 bg-white rounded-t-lg dark:bg-gray-700'>
                    <div className='flex flex-row gap-2'>
                        <MdCircle className='text-red-400 size-6'/>
                        <MdCircle className='text-green-400 size-6'/>
                        <MdCircle className='text-blue-400 size-6'/>
                    </div>
                    <div className='text-lg'>-- Preview --</div>
                    <button className='m-2 rounded-full' onClick={() => { setPreviewFile(null), setOpenFile(false)}}>
                        <IoMdClose className='size-6 hover:text-red-600' />
                    </button>
                               
                </div>
                    {previewFile ? (    
                        <FilePreview fileUrl={previewFile} />     
                    )
                    : <div className='text-center'>ไม่พบไฟล์</div>}
                </div>                                     
        </div>
    );
}