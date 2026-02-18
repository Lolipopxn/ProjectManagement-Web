import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const STRAPI_URL = process.env.STRAPI_BASE_URL || 'http://localhost:1337';

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

    if (!taskDocumentId || !projectDocumentId || !userId) {
      return NextResponse.json(
        { success: false, message: 'ข้อมูลไม่ครบถ้วน' },
        { status: 400 }
      );
    }

    // ตรวจสอบขนาดไฟล์ (จำกัดที่ 50MB)
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, message: 'ไฟล์มีขนาดใหญ่เกินไป จำกัดสูงสุด 50MB' },
        { status: 400 }
      );
    }

    // สร้างโครงสร้าง path แบบเดิม (ไม่มี timestamp)
    // รูปแบบ: submissions/{projectId}/{taskId}/{userId}/{filename}
    const fileExtension = file.name.split('.').pop();
    
    // ฟังก์ชันทำความสะอาดชื่อไฟล์ - รองรับภาษาไทยและอักษรต่างๆ
    const sanitizeFileName = (name: string): string => {
      // ลบเฉพาะตัวอักษรที่ไม่อนุญาตใน file system (< > : " / \ | ? * และ control characters)
      // แต่ยังคงภาษาไทย, ภาษาอื่นๆ, ตัวเลข, และอักษรพิเศษที่ปลอดภัย
      return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
    };
    
    const cleanFileName = customFileName 
      ? `${sanitizeFileName(customFileName)}.${fileExtension}`
      : sanitizeFileName(file.name);
    
    // สร้าง path ตามโครงสร้างเดิม (ไม่มี timestamp)
    const customPath = `submissions/${projectDocumentId}/${taskDocumentId}/${userId}/${cleanFileName}`;
    
    // สร้าง FormData สำหรับส่งไปยัง Strapi
    const strapiFormData = new FormData();
    strapiFormData.append('files', file);
    
    // สร้าง fileInfo object พร้อม path
    const fileInfo = {
      name: cleanFileName,
      path: customPath, // ส่ง path ที่กำหนดเอง
      caption: `Task: ${taskDocumentId}`,
      alternativeText: `Submission file for task ${taskDocumentId}`,
    };
    strapiFormData.append('fileInfo', JSON.stringify(fileInfo));

    // อัปโหลดไฟล์ไปยัง Strapi Media Library
    const uploadResponse = await fetch(`${STRAPI_URL}/api/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: strapiFormData,
    });

    if (!uploadResponse.ok) {
      const errorData = await uploadResponse.json();
      console.error('Strapi upload error:', errorData);
      return NextResponse.json(
        { success: false, message: 'ไม่สามารถอัปโหลดไฟล์ได้' },
        { status: uploadResponse.status }
      );
    }

    const uploadedFiles = await uploadResponse.json();
    
    if (!uploadedFiles || uploadedFiles.length === 0) {
      return NextResponse.json(
        { success: false, message: 'ไม่พบไฟล์ที่อัปโหลด' },
        { status: 500 }
      );
    }

    const uploadedFile = uploadedFiles[0];

    // ส่งกลับข้อมูลไฟล์
    return NextResponse.json({
      success: true,
      message: 'อัปโหลดไฟล์สำเร็จ',
      fileName: uploadedFile.name,
      fileUrl: uploadedFile.url, // URL สำหรับดาวน์โหลด (เริ่มต้นด้วย /uploads/)
      fileId: uploadedFile.id, // ID ของไฟล์ใน Media Library
      mimeType: uploadedFile.mime,
      size: uploadedFile.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการอัปโหลด' },
      { status: 500 }
    );
  }
}
