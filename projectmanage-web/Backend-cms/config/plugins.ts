export default ({ env }) => ({
    email: {
        config: {
          provider: 'nodemailer',
          providerOptions: {
            host: env('SMTP_HOST', 'smtp.gmail.com'),
            port: env('SMTP_PORT', 465),
            auth: {
              user: env('SMTP_USERNAME'),
              pass: env('SMTP_PASSWORD'),
            },
            secure: true, // สำหรับ SSL
          },
          settings: {
            defaultFrom: env('DEFAULT_EMAIL_FROM', 'your-email@gmail.com'),
            defaultReplyTo: env('DEFAULT_EMAIL_REPLY_TO', 'your-email@gmail.com'),
          },
        },
      },
    upload: {
        config: {
          sizeLimit: 50 * 1024 * 1024, // 50MB
          breakpoints: {
            xlarge: 1920,
            large: 1000,
            medium: 750,
            small: 500,
            xsmall: 64
          },
        },
      },
});
