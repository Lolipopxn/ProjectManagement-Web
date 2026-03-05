"use client";

import { useState } from "react";
import { IoMdClose, IoIosCloseCircle } from "react-icons/io";
import { FaCheckCircle } from "react-icons/fa";

interface ConfirmPopupProps {
    message: string;
    description: string;
    onConfirm: (done: (status: "success" | "fail") => void) => void;
    onCancel: () => void;
    onSuccessClose?: () => void;
}

export default function ConfirmPopup({
    message,
    description,
    onConfirm,
    onCancel,
    onSuccessClose
}: ConfirmPopupProps) {

    const [status, setStatus] = useState<"confirm" | "loading" | "success" | "fail">("confirm");

    const handleConfirm = () => {
        setStatus("loading");

        onConfirm((result) => {
            setStatus(result);
        });
    };

    return (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            {/* Container Popup*/}
            <div className="bg-white rounded-lg w-lg h-lg p-6 shadow-lg transition-all animate-in fade-in duration-300 scale-85 md:scale-100">

                {/* Confirm State */}
                {status === "confirm" && (
                    <div className="flex flex-col space-y-10">

                        <div className="flex flex-col space-y-6">
                            {/* Header*/}
                            <div className="flex items-start justify-between">
                                <p className="text-lg whitespace-normal">{message}</p>

                                <button
                                    onClick={onCancel}
                                    className="p-1 rounded-full hover:bg-gray-200"
                                >
                                    <IoMdClose className="size-6" />
                                </button>
                            </div>

                            {/*Description*/}
                            <p className="text-gray-600 whitespace-normal">
                                {description}
                            </p>

                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-between">
                            <button
                                onClick={onCancel}
                                className="bg-gray-300 px-4 py-2 rounded-md hover:bg-gray-400"
                            >
                                Cancel
                            </button>

                            <button
                                onClick={handleConfirm}
                                className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-400"
                            >
                                Confirm
                            </button>
                        </div>

                    </div>
                )}

                {/* Loading State */}
                {status === "loading" && (
                    <div className="flex flex-col items-center space-y-6 p-6">

                        <div className="w-10 h-10 border-4 border-gray-300 border-t-green-500 rounded-full animate-spin"></div>

                        <p className="text-gray-700 text-lg">Processing...</p>

                    </div>
                )}

                {/* Success State */}
                {status === "success" && (
                    <div className="flex flex-col items-center space-y-10 p-6">

                        <div className="flex flex-col items-center space-y-4">
                            <FaCheckCircle className="size-15 text-green-500"/>

                            <p className="text-lg text-green-500">
                                สำเร็จแล้ว
                            </p>
                        </div>
                        
                        <div className="w-full">
                            <button
                                onClick={() => {
                                    onSuccessClose?.();
                                    onCancel();
                                }}
                                className="bg-green-500 text-white px-4 py-2 hover:bg-green-400 w-full"
                            >
                                ปิด
                            </button>
                        </div>
                        

                    </div>
                )}

                {/* Fail State */}
                {status === "fail" && (
                    <div className="flex flex-col items-center space-y-10 p-6">

                        <div className="flex flex-col items-center space-y-4">
                            <IoIosCloseCircle className="text-red-500 size-15" />

                            <p className="text-lg text-red-500">
                                ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
                            </p>
                        </div>
                        

                        <div className="w-full">
                            <button
                                onClick={onCancel}
                                className="bg-red-500 text-white px-4 py-2 hover:bg-red-400 w-full"
                            >
                                Close
                            </button>
                        </div>

                    </div>
                )}

            </div>

        </div>
    );
}