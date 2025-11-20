'use client';

export default function HowToPage() {
    return (
        <section id="howto" className="bg-[#161815] h-auto"> 
            {/*Page step 1-2*/}
            <div className="bg-[#6E8CFB]">
                <div className="container mx-auto relative pt-15 px-10 max-w-[1320px] flex flex-col justify-center items-between">
                    <div className="justify-items-center border-2 rounded-[15px] bg-[#636CCB] mt-10 w-1/3 text-center self-center shadow-lg">
                        <h1 className="text-white text-2xl font-semibold py-5">How to Use Web Application ?</h1>
                    </div>
                    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-20 items-center">
                        <div className="col-span-1 md:order-1 space-y-6 text-black md:pl-30 py-8">
                            <div className="text-1xl border-2 rounded-[10px] bg-white w-1/4 justify-items-center font-semibold">
                                <h2>Step 1</h2>
                            </div>
                            <h2 className="text-3xl font-semibold">Create Your Project</h2>
                            <p className="text-base">สร้างโปรเจคใหม่ ตั้งชื่อโปรเจค และกำหนดรูปแบบการทำงานระบบจะสร้างพื้นที่สำหรับจัดการงานและสื่อสารให้แบบอัตโนมัติ</p>
                        </div>
                        <div className="col-span-1 md:order-2 mt-5 justify-items-center">
                            <img src="/Ld-1.png" alt="howto-img" className="h-[60%] w-[60%]"/>
                        </div>
                     </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-20 items-center">    
                        <div className="col-span-1 md:order-2 space-y-6 text-black md:pr-30 py-8">
                            <div className="text-1xl border-2 rounded-[10px] bg-white w-1/4 justify-items-center font-semibold">
                                <h2>Step 2</h2>
                            </div>
                            <h2 className="text-3xl font-semibold">Add Your Team Members</h2>
                            <p className="text-base">เพิ่มสมาชิกเข้ามาในโปรเจคแบ่งบทบาท เช่น หัวหน้า, สามาชิก เพื่อกำหนดสิทธิ์ที่เหมาะสมต่อการใช้งาน</p>
                        </div>

                        <div className="col-span-1 md:order-1 mt-5 justify-items-center">
                            <img src="/Ld-1.png" alt="howto-img" className="h-[60%] w-[60%]"/>
                        </div>
                     </div>

                </div>
            </div>

            {/*Page step 3-4*/}
            <div className="bg-[#161815]">
                <div className="container mx-auto relative pt-10 px-10 max-w-[1320px] flex flex-col justify-center items-between">    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-20 items-center">
                        <div className="col-span-1 md:order-1 space-y-6 text-white md:pl-30 py-8">
                            <div className="text-1xl border-2 rounded-[10px] bg-black w-1/4 justify-items-center font-semibold">
                                <h2>Step 3</h2>
                            </div>
                            <h2 className="text-3xl font-semibold">Manage Tasks with Kanban</h2>
                            <p className="text-base">สร้างงานใหม่ จัดลำดับความสำคัญ ตั้ง Deadline และมอบหมายให้คนในทีม จัดสถานะของงานง่าย ๆ บน Kanban board</p>
                        </div>
                        <div className="col-span-1 md:order-2 mt-5 justify-items-center">
                            <img src="/Ld-1.png" alt="howto-img" className="h-[60%] w-[60%]"/>
                        </div>
                     </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-20 items-center">    
                        <div className="col-span-1 md:order-2 space-y-6 text-white md:pr-30 py-8">
                            <div className="text-1xl border-2 rounded-[10px] bg-black w-1/4 justify-items-center font-semibold">
                                <h2>Step 4</h2>
                            </div>
                            <h2 className="text-3xl font-semibold">Communicate in Real-Time</h2>
                            <p className="text-base">ใช้ระบบ Chat และ Voice Room เพื่อสื่อสารในโปรเจคได้ทันทีสมาชิกสามารถส่งข้อความ แชร์ไฟล์ หรือเข้าห้องเสียงเพื่อประชุมแบบรวดเร็ว</p>
                        </div>

                        <div className="col-span-1 md:order-1 mt-5 justify-items-center">
                            <img src="/Ld-1.png" alt="howto-img" className="h-[60%] w-[60%]"/>
                        </div>
                     </div>

                </div>
            </div>

            {/*Page step 5*/}
            <div className="bg-[#6E8CFB]">
                <div className="container mx-auto relative pt-10 px-10 max-w-[1320px] flex flex-col justify-center items-between">    
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-20 items-center">
                        <div className="col-span-1 md:order-1 space-y-6 text-black md:pl-30 py-8">
                            <div className="text-1xl border-2 rounded-[10px] bg-white w-1/4 justify-items-center font-semibold">
                                <h2>Step 5</h2>
                            </div>
                            <h2 className="text-3xl font-semibold">Track Progress & Analytics</h2>
                            <p className="text-base">ดูความคืบหน้าของทีมจาก Dashboard ตรวจสอบงานที่ค้าง, งานที่กำลังทำ, และงานที่เสร็จแล้วเพื่อให้มั่นใจว่าโปรเจคเป็นไปตามแผน</p>
                        </div>
                        <div className="col-span-1 md:order-2 mt-5 justify-items-center">
                            <img src="/Ld-1.png" alt="howto-img" className="h-[60%] w-[60%]"/>
                        </div>
                     </div>

                </div>
            </div>
        </section>
    );
}