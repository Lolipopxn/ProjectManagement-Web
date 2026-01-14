export default [
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src': ["'self'", process.env.APP_ORIGIN],
          "frame-ancestors": [
            "'self'",
            "http://localhost:3000",
          ],
        }
      }
    }
  },
  {
    name: "strapi::cors",
    config: {
      origin: ["http://localhost:3000"],
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
