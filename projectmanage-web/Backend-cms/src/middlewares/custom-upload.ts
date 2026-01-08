import type { Core } from '@strapi/strapi';
import fs from 'fs-extra';
import path from 'path';

export default (config, { strapi }: { strapi: Core.Strapi }) => {
  return async (ctx, next) => {
    await next();

    // Check if this is an upload request
    if (ctx.request.url.includes('/api/upload') && ctx.request.method === 'POST') {
      const files = ctx.request.files?.files;
      const fileInfo = ctx.request.body?.fileInfo;
      
      if (files && fileInfo) {
        try {
          const parsedFileInfo = typeof fileInfo === 'string' ? JSON.parse(fileInfo) : fileInfo;
          const customPath = parsedFileInfo.path;

          if (customPath) {
            // Get uploaded file from Strapi response
            const uploadedFiles = Array.isArray(ctx.body) ? ctx.body : [ctx.body];

            for (const uploadedFile of uploadedFiles) {
              if (uploadedFile && uploadedFile.url) {
                // Construct new path
                const uploadsDir = path.join(strapi.dirs.static.public, 'uploads');
                
                // Normalize path separators to forward slashes for consistency
                const normalizedCustomPath = customPath.replace(/\\/g, '/');
                const newFilePath = path.join(uploadsDir, normalizedCustomPath);
                const oldFilePath = path.join(strapi.dirs.static.public, uploadedFile.url);

                // Ensure directory exists
                await fs.ensureDir(path.dirname(newFilePath));

                // Move file to custom path
                if (await fs.pathExists(oldFilePath)) {
                  await fs.move(oldFilePath, newFilePath, { overwrite: true });

                  // Update file URL in response (always use forward slashes for URLs)
                  const fileUrl = `/uploads/${normalizedCustomPath}`;
                  uploadedFile.url = fileUrl;
                  
                  // Store original filename for better display
                  const fileName = path.basename(normalizedCustomPath);
                  uploadedFile.name = fileName;
                  
                  // Update in database
                  await strapi.db.query('plugin::upload.file').update({
                    where: { id: uploadedFile.id },
                    data: {
                      url: fileUrl,
                      name: fileName, // Store the actual filename
                      hash: normalizedCustomPath.replace(/\.[^/.]+$/, ''), // Remove extension
                      ext: path.extname(normalizedCustomPath),
                    },
                  });
                  
                  strapi.log.info(`File moved successfully: ${fileUrl}`);
                }
              }
            }
          }
        } catch (error) {
          strapi.log.error('Custom upload middleware error:', error);
          // Don't throw error to prevent upload failure, just log it
        }
      }
    }
  };
};
