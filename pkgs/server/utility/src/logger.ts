import consola from 'consola'
export const log = consola.log
export const error = consola.error
import PrettyError from 'pretty-error'

const pe = new PrettyError()
export const prettyError = () => {
  const printError = (e: any) => {
    console.log(pe.render(e))
  }

  process.on('uncaughtException', (e) => {
    printError(e)
    process.exit(1)
  })
  process.on('unhandledRejection', (e) => {
    printError(e)
    process.exit(1)
  })

  return pe.render;
}
