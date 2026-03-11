"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import Navbar from "../../components/Nabbar_main/Navbar";
import { motion } from "framer-motion";

interface User {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  position?: string;
  company?: string;
  location?: string;
}

const PALETTE = {
  paper: "#F9F7F7",
  soft: "#DBE2EF",
  primary: "#3F72AF",
  ink: "#112D4E",
};

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ฟิลด์โปรไฟล์เพิ่มเติม
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [position, setPosition] = useState("");
  const [company, setCompany] = useState("");
  const [location, setLocation] = useState("");

  const getInitials = (name?: string, mail?: string) => {
    const base = (name?.trim() || mail?.split("@")[0] || "").trim();
    if (!base) return "?";
    const parts = base.split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  useEffect(() => {
    const loadMe = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/auth/me");
        const me: User = res.data.user;
        setUser(me);
        setToken(res.data.token);
        setUsername(me.username || "");
        setEmail(me.email || "");
        // เติมค่าฟิลด์เพิ่มเติมจากข้อมูลผู้ใช้
        setFirstName((me as any).firstName || "");
        setLastName((me as any).lastName || "");
        setPhone((me as any).phone || "");
        setBio((me as any).bio || "");
        setPosition((me as any).position || "");
        setCompany((me as any).company || "");
        setLocation((me as any).location || "");
      } catch (err: any) {
        if (err?.response?.status === 401) {
          router.replace("/login");
          return;
        }
        setError(err?.response?.data?.error || "โหลดข้อมูลผู้ใช้ไม่สำเร็จ");
      } finally {
        setLoading(false);
      }
    };
    loadMe();
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !token) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: Record<string, any> = {
        username,
        email,
        firstName,
        lastName,
        phone,
        bio,
        position,
        company,
        location,
      };

      await axios.put(
        `${process.env.NEXT_PUBLIC_STRAPI_BASE_URL}/api/users/${user.id}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        },
      );

      setSuccess("บันทึกข้อมูลเรียบร้อยแล้ว");
      setUser({
        ...user,
        username,
        email,
        firstName,
        lastName,
        phone,
        bio,
        position,
        company,
        location,
      } as User);
    } catch (err: any) {
      const msg =
        err?.response?.data?.error?.message ||
        err?.response?.data?.message ||
        "บันทึกข้อมูลไม่สำเร็จ";
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div
        className="min-h-screen w-full bg-white dark:bg-gray-900"
      >
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div
            className="animate-pulse rounded-2xl border bg-white/70 p-6 shadow-sm dark:bg-gray-900"
            style={{ borderColor: `${PALETTE.soft}` }}
          >
            <div className="mb-4 flex items-center gap-4">
              <div
                className="h-12 w-12 rounded-full"
                style={{ backgroundColor: PALETTE.soft }}
              />
              <div
                className="h-4 w-40 rounded"
                style={{ backgroundColor: PALETTE.soft }}
              />
            </div>
            <div
              className="h-10 w-full rounded"
              style={{ backgroundColor: `${PALETTE.soft}` }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-gray-900">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="relative overflow-hidden rounded-2xl shadow-xl ring-1 ring-slate-200 dark:ring-slate-700 bg-white/90 dark:bg-gray-800 backdrop-blur">
          {/* Back button */}
          <motion.button
            type="button"
            onClick={() => router.back()}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-lg border border-blue-200 dark:border-blue-700 px-3 py-2 text-sm font-medium shadow-sm bg-white/70 dark:bg-gray-700 text-slate-900 dark:text-white"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span>ย้อนกลับ</span>
          </motion.button>

          {/* Header */}
          <div className="flex flex-col items-center gap-4 px-6 pb-8 pt-12 text-center bg-slate-200/40 dark:bg-slate-700/40 border-b border-slate-200 dark:border-slate-700">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-slate-900 dark:text-white">
                แก้ไขโปรไฟล์
              </h1>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                อัปเดตข้อมูลส่วนตัวและช่องทางติดต่อของคุณ
              </p>
            </div>

            {/* Avatar */}
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 180, damping: 18 }}
              className="grid h-24 w-24 md:h-28 md:w-28 place-items-center rounded-full text-xl font-semibold text-white shadow ring-4 ring-white bg-gradient-to-br from-blue-600 to-slate-900"
            >
              {getInitials(
                [firstName, lastName].filter(Boolean).join(" ") || username,
                email,
              )}
            </motion.div>

            <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">{username || "—"}</span>
              <span className="mx-2">•</span>
              <span>{email || "no-email"}</span>
            </div>
          </div>

          {/* Alerts */}
          {(error || success) && (
            <div className="px-6 pt-4">
              {error && (
                <div className="mb-3 rounded-lg px-3 py-2 text-sm bg-red-100 border border-red-300 text-red-700">
                  {error}
                </div>
              )}
              {success && (
                <div className="mb-3 rounded-lg px-3 py-2 text-sm bg-green-100 border border-green-300 text-green-700">
                  {success}
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            {/* Account card */}
            <section className="rounded-xl p-4 md:p-5 bg-slate-200/40 dark:bg-slate-700/40 border border-slate-200 dark:border-slate-700">
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-900 dark:text-white">
                  ข้อมูลบัญชี
                </h2>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  จำเป็น
                </span>
              </header>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
                    ชื่อผู้ใช้
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm shadow-sm focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm shadow-sm focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800 outline-none"
                    required
                  />
                </div>
              </div>
            </section>

            {/* Personal */}
            <section className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-slate-900 dark:text-white">
                ข้อมูลส่วนตัว
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="ชื่อจริง"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800"
                />

                <input
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="นามสกุล"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600  bg-white dark:bg-gray-800 px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800"
                />

                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="เบอร์โทรศัพท์"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800"
                />

                <input
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  placeholder="ตำแหน่งงาน"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800"
                />

                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="บริษัท"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800"
                />

                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="จังหวัด/ประเทศ"
                  className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800"
                />

                <textarea
                  rows={4}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="บอกเกี่ยวกับตัวคุณสั้น ๆ"
                  className="md:col-span-2 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm shadow-sm outline-none focus:ring-4 focus:ring-blue-200 dark:focus:ring-blue-800"
                />
              </div>
            </section>

            {/* Footer */}
            <div className="mt-8 flex justify-end gap-3 border-t border-slate-200 dark:border-slate-700 pt-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-lg border border-slate-300 dark:border-slate-600 px-4 py-2.5 text-sm font-medium bg-white dark:bg-gray-800 text-slate-900 dark:text-white"
              >
                ยกเลิก
              </button>

              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60"
              >
                {saving ? "กำลังบันทึก..." : "บันทึก"}
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
