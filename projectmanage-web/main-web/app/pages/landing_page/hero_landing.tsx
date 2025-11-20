"use client";

import { IoDocumentOutline } from "react-icons/io5";
import { FiRadio} from "react-icons/fi";
import { FaArrowDown } from "react-icons/fa6";
import { MdOutlineGroup } from "react-icons/md";

export default function Header() {
    return (
            <section id="header" className="bg-[#161815] h-auto">
                <div className="container mx-auto relative py-25 px-4 text-white max-w-[1320px] h-auto flex flex-col justify-center items-center text-center space-y-8">
                    <div className="space-y-5">
                       <h1 className="text-[#6E8CFB] text-2xl md:text-7xl font-semibold leading-[1.2] text-shadow-lg text-shadow-blue-700">Project Management <br /> <span className="text-white">For You</span></h1> 
                       <p className=" px-90 text-[#909090] text-md">แพลตฟอร์มที่ออกแบบมาสำหรับ นักเรียน นักศึกษา เพื่อช่วยให้คุณจัดการงานและทำงานร่วมกันได้อย่างราบรื่น</p>
                    </div>

                    <a href="#howto">
                        <button className="bg-[#6E8CFB] flex flex-row justify-center items-center gap-3 px-6 py-3 rounded-md text-white font-medium hover:bg-[#50589C] transition shadow-md shadow-[#3C467B]">
                            Read more
                            <div className="flex flex-row justify-center items-center animate-bounce">
                                <FaArrowDown/>
                                <FaArrowDown/>
                            </div>  
                        </button>
                    </a>

                    <div className="grid grid-cols-1 md:grid-cols-3 text-start gap-10">
                        <div className="space-y-3 shadow-lg py-6 px-6 bg-[#1E201D] rounded-[12px]">
                            <IoDocumentOutline className="text-[#6E8CFB] w-[24px] h-[24px]" />
                            <h3 className="text-white">ด้านการจัดการงาน</h3>
                            <p className="text-[#909090]">ระบบจัดการงานที่ช่วยให้ทีมวางแผนงานได้อย่างเป็นระบบ รองรับ Kanban Board, การกำหนด Deadline, Priority, Subtask  และการติดตามความคืบหน้า ช่วยให้โปรเจคเดินตามแผนอย่างมีประสิทธิภาพ</p>
                        </div>
                        <div className="space-y-3 shadow-lg py-6 px-6 bg-[#1E201D] rounded-[12px]">
                            <FiRadio className="text-[#6E8CFB] w-[24px] h-[24px]" />
                            <h3 className="text-white">ด้านการสื่อสาร</h3>
                            <p className="text-[#909090]">สื่อสารกับทีมได้อย่างราบรื่นผ่านระบบแชทและห้องเสียง ส่งข้อความ แชร์ไฟล์ และพูดคุยแบบเรียลไทม์ได้ภายในโปรเจคเดียว ลดการสลับแอพระหว่างทำงาน ทำให้การทำงานร่วมกันรวดเร็วขึ้น</p>
                        </div>
                        <div className="space-y-3 shadow-lg py-6 px-6 bg-[#1E201D] rounded-[12px]">
                            <MdOutlineGroup className="text-[#6E8CFB] w-[24px] h-[24px]" />
                            <h3 className="text-white">ด้านการทำงานเป็นทีม</h3>
                            <p className="text-[#909090]">เพิ่มสมาชิก แบ่งบทบาท และกำหนดสิทธิ์การเข้าถึงได้อย่างยืดหยุ่น ช่วยให้ทุกคนเข้าใจหน้าที่ของตัวเอง ทำงานประสานกันได้อย่างเป็นระบบ พร้อมดูข้อมูลกิจกรรมล่าสุดของทีมเพื่อตรวจสอบได้ง่าย</p>
                        </div>
                    </div>
                </div>
            </section>
    );
}