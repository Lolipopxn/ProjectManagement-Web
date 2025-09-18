module.exports = {
    routes: [
      {
        method: 'POST',
        path: '/voice/token',
        handler: 'voice.token',
        config: {
          policies: ['global::isAuthenticated'],
        },
      },
    ],
  };