"use client";

import { useState } from "react";
import ConfirmPopup from "../components/ComfirmPopup";

export default function TestPage() {
  const [isOpen, setIsOpen] = useState(false);

  async function deleteTask(id: string) {
        await new Promise((r) => setTimeout(r, 2000));
        return false;
    }

  return (
    <div className="p-10">
        <h1 className="text-2xl font-bold mb-4">Test Page</h1>
        <button 
          onClick={() => setIsOpen(true)}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-300"
        >
          test popup
        </button>
        {isOpen && (
          <ConfirmPopup
                    message="Delete this task?"
                    description="This action cannot be undone."
                    onCancel={() => setIsOpen(false)}
                    onConfirm={async (done) => {

                        try {
                            const result = await deleteTask("123");

                            if (result) done("success");
                            else done("fail");

                        } catch {
                            done("fail");
                        }
                    }}
                />
        )}
    </div>
  );
}
