export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", process.env.APP_ORIGIN]
        }
      }
    }
  },
  {
    name: 'strapi::cors',
    config: {
      origin: [process.env.APP_ORIGIN],
      credentials: true, // เพิ่มบรรทัดนี้เพื่อรองรับ cookies
      headers: ['Content-Type', 'Authorization']
    }
  },
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
