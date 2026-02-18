export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", process.env.FRONTEND_URL],
          "frame-ancestors": [
            "'self'",
            process.env.FRONTEND_URL,
          ],
        }
      }
    }
  },
  {
    name: "strapi::cors",
    config: {
      origin: [process.env.FRONTEND_URL],
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      headers: ["Content-Type", "Authorization"],
      credentials: true,
    },
  },
  'strapi::logger',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  'global::custom-upload', // เพิ่ม custom middleware
];
