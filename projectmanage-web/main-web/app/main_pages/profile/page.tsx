'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import Navbar from '../../components/Nabbar_main/Navbar';
import { motion } from 'framer-motion';

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
  paper: '#F9F7F7',
  soft: '#DBE2EF',
  primary: '#3F72AF',
  ink: '#112D4E',
};

export default function EditProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string>('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // ฟิลด์โปรไฟล์เพิ่มเติม
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [bio, setBio] = useState('');
  const [position, setPosition] = useState('');
  const [company, setCompany] = useState('');
  const [location, setLocation] = useState('');

  const getInitials = (name?: string, mail?: string) => {
    const base = (name?.trim() || mail?.split('@')[0] || '').trim();
    if (!base) return '?';
    const parts = base.split(/[\s._-]+/).filter(Boolean);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  };

  useEffect(() => {
    const loadMe = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/auth/me');
        const me: User = res.data.user;
        setUser(me);
        setToken(res.data.token);
        setUsername(me.username || '');
        setEmail(me.email || '');
        // เติมค่าฟิลด์เพิ่มเติมจากข้อมูลผู้ใช้
        setFirstName((me as any).firstName || '');
        setLastName((me as any).lastName || '');
        setPhone((me as any).phone || '');
        setBio((me as any).bio || '');
        setPosition((me as any).position || '');
        setCompany((me as any).company || '');
        setLocation((me as any).location || '');
      } catch (err: any) {
        if (err?.response?.status === 401) {
          router.replace('/login');
          return;
        }
        setError(err?.response?.data?.error || 'โหลดข้อมูลผู้ใช้ไม่สำเร็จ');
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

      await axios.put(`${process.env.NEXT_PUBLIC_STRAPI_BASE_URL}/api/users/${user.id}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setSuccess('บันทึกข้อมูลเรียบร้อยแล้ว');
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
        'บันทึกข้อมูลไม่สำเร็จ';
      setError(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full" style={{ backgroundColor: PALETTE.paper }}>
        <div className="mx-auto max-w-2xl px-4 py-8">
          <div
            className="animate-pulse rounded-2xl border bg-white/70 p-6 shadow-sm"
            style={{ borderColor: `${PALETTE.soft}` }}
          >
            <div className="mb-4 flex items-center gap-4">
              <div className="h-12 w-12 rounded-full" style={{ backgroundColor: PALETTE.soft }} />
              <div className="h-4 w-40 rounded" style={{ backgroundColor: PALETTE.soft }} />
            </div>
            <div className="h-10 w-full rounded" style={{ backgroundColor: `${PALETTE.soft}` }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: PALETTE.paper }}>

      {/* Container กว้างขึ้น และมี spacing ที่โปร่งขึ้น */}
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div
          className="relative overflow-hidden rounded-2xl shadow-xl ring-1 backdrop-blur"
          style={{ backgroundColor: '#FFFFFFEE', borderColor: PALETTE.soft }}
        >
          {/* ปุ่มย้อนกลับซ้ายบน + อนิเมชัน */}
          <motion.button
            type="button"
            onClick={() => router.back()}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="group absolute left-3 top-3 z-10 inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium shadow-sm backdrop-blur-sm"
            style={{
              borderColor: `${PALETTE.primary}33`,
              background: 'rgba(255,255,255,0.7)',
              color: PALETTE.ink,
            }}
            aria-label="ย้อนกลับ"
          >
            <svg
              className="h-4 w-4 transition-transform group-hover:-translate-x-0.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            <span>ย้อนกลับ</span>
          </motion.button>

          {/* Top bar / Header – จัดกึ่งกลางและมี avatar ใหญ่ชัด */}
          <div
            className="flex flex-col items-center gap-4 px-6 pb-8 pt-12 text-center"
            style={{
              background: `linear-gradient(180deg, ${PALETTE.soft}66, transparent)`,
              borderBottom: `1px solid ${PALETTE.soft}`,
            }}
          >
            <div>
              <h1 className="text-xl md:text-2xl font-semibold" style={{ color: PALETTE.ink }}>
                แก้ไขโปรไฟล์
              </h1>
              <p className="text-sm" style={{ color: `${PALETTE.ink}99` }}>
                อัปเดตข้อมูลส่วนตัวและช่องทางติดต่อของคุณ
              </p>
            </div>
            <motion.div
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              className="grid h-24 w-24 md:h-28 md:w-28 place-items-center rounded-full text-xl font-semibold text-white shadow ring-4 ring-white"
              style={{ background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.ink})` }}
            >
              {getInitials([firstName, lastName].filter(Boolean).join(' ') || username, email)}
            </motion.div>

            {/* ชื่อ + อีเมลแสดงซ้ำใต้ avatar เพื่อย้ำบริบท */}
            <div className="mt-1 text-sm" style={{ color: `${PALETTE.ink}AA` }}>
              <span className="font-medium">{username || '—'}</span>
              <span className="mx-2">•</span>
              <span>{email || 'no-email'}</span>
            </div>
          </div>

          {/* Alerts */}
          {(error || success) && (
            <div className="px-6 pt-4">
              {error && (
                <div
                  className="mb-3 rounded-lg px-3 py-2 text-sm"
                  style={{ backgroundColor: '#ffe5e7', border: '1px solid #f8b4b8', color: '#8a1f2b' }}
                >
                  {error}
                </div>
              )}
              {success && (
                <div
                  className="mb-3 rounded-lg px-3 py-2 text-sm"
                  style={{ backgroundColor: '#e6f6ef', border: '1px solid #b6e3cf', color: '#0f4a3c' }}
                >
                  {success}
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-6 py-6">
            {/* บัตรข้อมูลบัญชี */}
            <section
              className="rounded-xl p-4 md:p-5"
              style={{ backgroundColor: `${PALETTE.soft}44`, border: `1px solid ${PALETTE.soft}` }}
            >
              <header className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold" style={{ color: PALETTE.ink }}>ข้อมูลบัญชี</h2>
                <span className="text-xs" style={{ color: `${PALETTE.ink}80` }}>จำเป็น</span>
              </header>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="md:col-span-1">
                  <label htmlFor="username" className="mb-1 block text-sm font-medium" style={{ color: PALETTE.ink }}>
                    ชื่อผู้ใช้
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-4"
                    style={{ borderColor: `${PALETTE.soft}`, color: PALETTE.ink, caretColor: PALETTE.primary }}
                    placeholder="username"
                    required
                  />
                  <p className="mt-1 text-xs" style={{ color: `${PALETTE.ink}99` }}>
                    ชื่อที่จะแสดงต่อผู้ใช้งานคนอื่น
                  </p>
                </div>

                <div className="md:col-span-1">
                  <label htmlFor="email" className="mb-1 block text-sm font-medium" style={{ color: PALETTE.ink }}>
                    อีเมล
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-4"
                    style={{ borderColor: `${PALETTE.soft}`, color: PALETTE.ink, caretColor: PALETTE.primary }}
                    placeholder="email@example.com"
                    required
                  />
                  <p className="mt-1 text-xs" style={{ color: `${PALETTE.ink}99` }}>
                    ใช้สำหรับแจ้งเตือนและกู้คืนบัญชี
                  </p>
                </div>
              </div>
            </section>

            {/* กลุ่ม: ข้อมูลส่วนตัว */}
            <section className="mt-6">
              <h2 className="mb-2 text-sm font-semibold" style={{ color: PALETTE.ink }}>
                ข้อมูลส่วนตัว
              </h2>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label htmlFor="firstName" className="mb-1 block text-sm font-medium" style={{ color: PALETTE.ink }}>
                    ชื่อจริง
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-4"
                    style={{ borderColor: `${PALETTE.soft}`, color: PALETTE.ink, caretColor: PALETTE.primary }}
                    placeholder="ชื่อจริง"
                  />
                </div>

                <div>
                  <label htmlFor="lastName" className="mb-1 block text-sm font-medium" style={{ color: PALETTE.ink }}>
                    นามสกุล
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-4"
                    style={{ borderColor: `${PALETTE.soft}`, color: PALETTE.ink, caretColor: PALETTE.primary }}
                    placeholder="นามสกุล"
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="mb-1 block text-sm font-medium" style={{ color: PALETTE.ink }}>
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-4"
                    style={{ borderColor: `${PALETTE.soft}`, color: PALETTE.ink, caretColor: PALETTE.primary }}
                    placeholder="0812345678"
                  />
                </div>

                <div>
                  <label htmlFor="position" className="mb-1 block text-sm font-medium" style={{ color: PALETTE.ink }}>
                    ตำแหน่งงาน
                  </label>
                  <input
                    id="position"
                    type="text"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-4"
                    style={{ borderColor: `${PALETTE.soft}`, color: PALETTE.ink, caretColor: PALETTE.primary }}
                    placeholder="เช่น Project Manager"
                  />
                </div>

                <div>
                  <label htmlFor="company" className="mb-1 block text-sm font-medium" style={{ color: PALETTE.ink }}>
                    บริษัท
                  </label>
                  <input
                    id="company"
                    type="text"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-4"
                    style={{ borderColor: `${PALETTE.soft}`, color: PALETTE.ink, caretColor: PALETTE.primary }}
                    placeholder="ชื่อบริษัท"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="mb-1 block text-sm font-medium" style={{ color: PALETTE.ink }}>
                    พื้นที่
                  </label>
                  <input
                    id="location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-4"
                    style={{ borderColor: `${PALETTE.soft}`, color: PALETTE.ink, caretColor: PALETTE.primary }}
                    placeholder="จังหวัด/ประเทศ"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="bio" className="mb-1 block text-sm font-medium" style={{ color: PALETTE.ink }}>
                    แนะนำตัว
                  </label>
                  <textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="w-full rounded-lg border bg-white px-3 py-2.5 text-sm shadow-sm outline-none transition focus:ring-4"
                    style={{ borderColor: `${PALETTE.soft}`, color: PALETTE.ink, caretColor: PALETTE.primary }}
                    placeholder="บอกเกี่ยวกับตัวคุณสั้น ๆ"
                  />
                </div>
              </div>
            </section>

            {/* Footer actions */}
            <div
              className="-mx-6 mt-8 flex items-center justify-end gap-3 rounded-xl px-4 py-4"
              style={{ borderTop: `1px solid ${PALETTE.soft}`, backgroundColor: `${PALETTE.soft}33` }}
            >
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center rounded-lg border px-4 py-2.5 text-sm font-medium shadow-sm transition hover:shadow"
                style={{ borderColor: `${PALETTE.primary}33`, backgroundColor: '#FFFFFF', color: PALETTE.ink }}
              >
                ยกเลิก
              </button>

              <motion.button
                type="submit"
                disabled={saving}
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                className="inline-flex items-center rounded-lg px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:shadow-lg disabled:opacity-60"
                style={{ background: `linear-gradient(135deg, ${PALETTE.primary}, ${PALETTE.ink})` }}
              >
                {saving && (
                  <svg className="mr-2 h-4 w-4 animate-spin text-white" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                )}
                {saving ? 'กำลังบันทึก...' : 'บันทึก'}
              </motion.button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
