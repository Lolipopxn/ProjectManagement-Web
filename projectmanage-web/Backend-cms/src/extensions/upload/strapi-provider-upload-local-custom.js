const fs = require('fs');
const path = require('path');
const fse = require('fs-extra');

module.exports = {
  init(providerOptions) {
    // Use custom upload dir or default to public/uploads
    const uploadDir = providerOptions.uploadDir || path.join(strapi.dirs.static.public, 'uploads');

    return {
      async upload(file) {
        // Get custom path from fileInfo if provided
        const customPath = file.path || '';
        
        // Construct full path
        const filePath = path.join(uploadDir, customPath);
        const dirPath = path.dirname(filePath);

        // Ensure directory exists
        await fse.ensureDir(dirPath);

        // Write file
        await fse.writeFile(filePath, file.buffer);

        // Set file URL (relative to /uploads)
        file.url = `/uploads/${customPath}`.replace(/\\/g, '/');
      },

      async delete(file) {
        const filePath = path.join(uploadDir, file.hash + file.ext);

        // Delete file if exists
        if (fs.existsSync(filePath)) {
          await fse.remove(filePath);
        }
      },
    };
  },
};
