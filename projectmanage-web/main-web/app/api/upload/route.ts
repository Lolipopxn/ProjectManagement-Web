import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'ไม่ได้รับอนุญาต' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const taskDocumentId = formData.get('taskDocumentId') as string;
    const projectDocumentId = formData.get('projectDocumentId') as string;
    const userId = formData.get('userId') as string;
    const customFileName = formData.get('customFileName') as string | null;

    if (!file) {
      return NextResponse.json(
        { success: false, message: 'ไม่มีไฟล์ที่อัปโหลด' },
        { status: 400 }
      );
    }

    if (!taskDocumentId) {
      return NextResponse.json(
        { success: false, message: 'ไม่ระบุ taskDocumentId' },
        { status: 400 }
      );
    }

    if (!projectDocumentId) {
      return NextResponse.json(
        { success: false, message: 'ไม่ระบุ projectDocumentId' },
        { status: 400 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'ไม่ระบุ userId' },
        { status: 400 }
      );
    }

    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'ไฟล์มีขนาดใหญ่เกินไป จำกัดสูงสุด 100MB' },
        { status: 400 }
      );
    }

    // ตรวจสอบประเภทไฟล์
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'application/zip', 'application/x-rar-compressed',
      'video/mp4', 'video/quicktime', 'video/x-msvideo'
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, message: 'ประเภทไฟล์ไม่ถูกต้อง' },
        { status: 400 }
      );
    }

    // สร้างชื่อไฟล์ที่ไม่ซ้ำ
    const timestamp = Date.now();
    const fileExtension = path.extname(file.name);
    // ใช้ชื่อไฟล์ที่กำหนดเองถ้ามี หรือใช้ชื่อไฟล์เดิม
    const fileName = customFileName ? `${customFileName}${fileExtension}` : file.name;
    
    // สร้างโฟลเดอร์ตามโครงสร้าง: uploads/submissions/[projectDocumentId]/[taskDocumentId]/[userId]/[timestamp]/
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'submissions', projectDocumentId, taskDocumentId, userId, timestamp.toString());
    try {
      await mkdir(uploadsDir, { recursive: true });
    } catch (error) {
      // โฟลเดอร์อาจมีอยู่แล้ว
    }

    // บันทึกไฟล์
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filePath = path.join(uploadsDir, fileName);
    
    await writeFile(filePath, buffer);

    // สร้าง URL สำหรับเข้าถึงไฟล์
    const fileUrl = `/uploads/submissions/${projectDocumentId}/${taskDocumentId}/${userId}/${timestamp}/${fileName}`;

    return NextResponse.json({
      success: true,
      fileUrl: fileUrl,
      fileName: customFileName ? `${customFileName}${fileExtension}` : file.name,
      fileSize: file.size,
      fileType: file.type,
      message: 'อัปโหลดไฟล์สำเร็จ'
    });

  } catch (error: any) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { success: false, message: 'ล้มเหลวในการอัปโหลดไฟล์' },
      { status: 500 }
    );
  }
}
