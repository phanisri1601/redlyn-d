export default {
  serverExternalPackages: ['firebase-admin', '@google-cloud/firestore', '@libsql/client'],
  poweredByHeader: false,
  outputFileTracingIncludes: {'/api/*': ['./public/**/*'], '/preview/*': ['./public/**/*']},
  outputFileTracingExcludes: {'/*': ['./.env*', './.data/**/*', './*-firebase-adminsdk-*.json', './LOCAL-BACKUP*/**/*']},
  async headers() { return [{source: '/:path*', headers: [
    {key: 'X-Content-Type-Options', value: 'nosniff'},
    {key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin'}
  ]}, {source:'/generated/:path*',headers:[{key:'Access-Control-Allow-Origin',value:'*'},{key:'Cache-Control',value:'public, max-age=31536000, immutable'}]}]; }
};
