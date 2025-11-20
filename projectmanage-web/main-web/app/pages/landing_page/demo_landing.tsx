"use client";

import { AiFillPicture } from "react-icons/ai";

export default function Page() {
  return (
    <section id="demo" className="bg-[#161815] h-auto">
      <div className="container mx-auto relative px-25 py-25 max-w-[1320px] text-white flex flex-col space-y-10">
        {/*Title*/}
        <div className="justify-items-center space-y-5">
          <h1 className="text-2xl font-semibold border-2 border-[#ffffff] py-2 px-10 rounded-[12] bg-[#6E8CFB] shadow-lg">Demo: Mydaily</h1>
          <p className="text-center font-normal text-sm">
            ส่วนนี้จะเป็นวิดิโอที่อธิบายและเเสดงเกี่ยวกับการใช้งานเว็บแอพลิเคชันทั้งหมด
          </p>
        </div>

        {/*Demo video*/}
        <div className="flex justify-center items-center border-2 px-10">
          <AiFillPicture className="h-[50%] w-[40%]" />
        </div>
      </div>
      <div className="h-10 bg-[#939393]"></div>
    </section>
  );
}
