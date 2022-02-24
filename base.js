const { spawn } = require('child_process')
const fs = require('fs')

const start = () => {
  if (process.argv.length < 3) {
    process.argv.push('./pkgs/boot/src/main.ts')
  } else {
    process.argv.splice(2, 0, './pkgs/boot/src/main.ts')
  }
  const esr = require('esbuild-runner/lib/cli')
  esr.main()
}

if (!fs.existsSync('node_modules')) {
  const pnpm = spawn('pnpm', ['i'], { stdio: 'inherit' })

  pnpm.on('exit', function () {
    start()
  })
} else {
  start()
}
