module.exports = {
  type: 'bundle', // bundle or transform (see description above)
  esbuild: {
    external: [
      '.prisma/client/index',
      'dbs',
      'chokidar',
      'react',
      'react-dom',
      'commander',
      'fs-extra',
      'prettier',
    ],
  },
}
