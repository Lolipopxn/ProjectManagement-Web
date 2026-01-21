"use client";

import { motion } from "framer-motion";

export default function HowToPage() {
  const sectionContainer = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: 0.18,
      },
    },
  };

  const fadeUp = {
    hidden: { opacity: 0, y: 40 },
    show: { opacity: 1, y: 0 },
  };

  const slideLeft = {
    hidden: { opacity: 0, x: -60 },
    show: { opacity: 1, x: 0 },
  };

  const slideRight = {
    hidden: { opacity: 0, x: 60 },
    show: { opacity: 1, x: 0 },
  };

  const imageZoom = {
    hidden: { opacity: 0, scale: 0.92 },
    show: { opacity: 1, scale: 1 },
  };

  const viewportOptions = { once: true, amount: 0.35 };

  return (
    <section id="howto" className="bg-[#161815] h-auto">
      {/* ====================== STEP 1-2 ====================== */}
      <div className="bg-[#6E8CFB]">
        <motion.div
          variants={sectionContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOptions}
          className="container mx-auto relative py-20 px-10 max-w-[1600px] flex flex-col justify-center space-y-20"
        >
          {/* Title */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.75, ease: "easeOut" }}
            className="justify-items-center border-2 rounded-[15px] bg-[#636CCB] mt-10 w-full md:w-1/3 text-center self-center shadow-lg"
          >
            <h1 className="text-white text-2xl font-semibold py-5">
              How to Use Web Application ?
            </h1>
          </motion.div>

          {/* Step 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-10 items-center">
            {/* Text */}
            <motion.div
              variants={slideLeft}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="col-span-1 md:order-1 space-y-6 text-black py-8"
            >
              <div className="text-1xl border-2 rounded-[10px] bg-white w-1/4 justify-items-center font-semibold">
                <h2>Step 1</h2>
              </div>

              <h2 className="text-3xl font-semibold">
                Create Your Project & Add Your Members
              </h2>

              <p className="text-base">
                สร้างโปรเจคใหม่ ตั้งชื่อโปรเจค เพิ่มสมาชิก และกำหนดรูปแบบการทำงาน
                ระบบจะสร้างพื้นที่สำหรับจัดการงานและสื่อสารให้แบบอัตโนมัติ
              </p>
            </motion.div>

            {/* Image */}
            <motion.div
              variants={imageZoom}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="col-span-1 md:order-2 mt-5 justify-items-center"
            >
              <motion.img
                src="/Create_Project.png"
                alt="Create project"
                className="size-full rounded-2xl shadow-xl"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.25 }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ====================== STEP 3-4 ====================== */}
      <div className="bg-[#161815]">
        <motion.div
          variants={sectionContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOptions}
          className="container mx-auto relative py-10 px-10 max-w-[1600px] flex flex-col justify-center space-y-20"
        >
          {/* Step 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-20 items-center">
            {/* Text */}
            <motion.div
              variants={slideLeft}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="col-span-1 md:order-1 space-y-6 text-white py-8"
            >
              <div className="text-1xl border-2 rounded-[10px] bg-black w-1/4 justify-items-center font-semibold">
                <h2>Step 3</h2>
              </div>

              <h2 className="text-3xl font-semibold">Assign Member To Task</h2>

              <p className="text-base">
                มอบหมาย หรือ กระจายงานให้สมาชิก เพื่อช่วยให้คุณจัดการงานและทำงานร่วมกันได้อย่างราบรื่น
              </p>
            </motion.div>

            {/* Image */}
            <motion.div
              variants={imageZoom}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="col-span-1 md:order-2 mt-5 justify-items-center"
            >
              <motion.img
                src="/AssignMember.png"
                alt="Assign member"
                className="size-full rounded-2xl shadow-xl"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.25 }}
              />
            </motion.div>
          </div>

          {/* Step 4 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-20 items-center">
            {/* Text (ฝั่งขวา) */}
            <motion.div
              variants={slideRight}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="col-span-1 md:order-2 space-y-6 text-white py-8 md:pl-10"
            >
              <div className="text-1xl border-2 rounded-[10px] bg-black w-1/4 justify-items-center font-semibold">
                <h2>Step 4</h2>
              </div>

              <h2 className="text-3xl font-semibold">Communicate in Real-Time</h2>

              <p className="text-base">
                ใช้ระบบ Chat และ Voice Room เพื่อสื่อสารในโปรเจคได้ทันที สมาชิกสามารถส่งข้อความ
                แชร์ไฟล์ หรือเข้าห้องเสียงเพื่อประชุมแบบรวดเร็ว
              </p>
            </motion.div>

            {/* Image (ฝั่งซ้าย) */}
            <motion.div
              variants={imageZoom}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="col-span-1 md:order-1 mt-5 justify-items-center"
            >
              <motion.img
                src="/Chat.png"
                alt="Chat & voice room"
                className="size-full rounded-2xl shadow-xl"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.25 }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* ====================== STEP 5 ====================== */}
      <div className="bg-[#6E8CFB]">
        <motion.div
          variants={sectionContainer}
          initial="hidden"
          whileInView="show"
          viewport={viewportOptions}
          className="container mx-auto relative py-10 px-10 max-w-[1600px] flex flex-col justify-center"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-20 items-center">
            {/* Text */}
            <motion.div
              variants={slideLeft}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="col-span-1 md:order-1 space-y-6 text-black py-8"
            >
              <div className="text-1xl border-2 rounded-[10px] bg-white w-1/4 justify-items-center font-semibold">
                <h2>Step 5</h2>
              </div>

              <h2 className="text-3xl font-semibold">
                Track Progress & Analytics
              </h2>

              <p className="text-base">
                ดูความคืบหน้าของทีมจาก Dashboard ตรวจสอบงานที่ค้าง, งานที่กำลังทำ,
                และงานที่เสร็จแล้วเพื่อให้มั่นใจว่าโปรเจคเป็นไปตามแผน
              </p>
            </motion.div>

            {/* Image */}
            <motion.div
              variants={imageZoom}
              transition={{ duration: 0.9, ease: "easeOut" }}
              className="col-span-1 md:order-2 mt-5 justify-items-center"
            >
              <motion.img
                src="/GanttChart.png"
                alt="Progress dashboard"
                className="size-full rounded-2xl shadow-xl"
                whileHover={{ scale: 1.03 }}
                transition={{ duration: 0.25 }}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}