import { dirname } from 'path'
import ts from 'typescript'

const compilerOptionsCache = new Map()
const getCompilerOptions = (tsconfig = '') => {
  const cachedCompilerOptions = compilerOptionsCache.get(tsconfig)

  if (cachedCompilerOptions) {
    return cachedCompilerOptions
  }

  const compilerOptions = tsconfig
    ? ts.parseJsonConfigFileContent(
        ts.readConfigFile(tsconfig, ts.sys.readFile).config,
        ts.sys,
        dirname(tsconfig)
      ).options
    : ts.getDefaultCompilerOptions()

  compilerOptions.allowJs = true // for automatic JS support

  compilerOptionsCache.set(tsconfig, compilerOptions)

  return compilerOptions
}

export class ServiceHost implements ts.LanguageServiceHost {
  fileName: string
  content: string
  compilerOptions: any
  /**
   * Create a service host instance for the given file.
   *
   * @param {string} name path to file
   * @param {string} content file content
   */
  constructor(name: string, content: string) {
    const tsconfig = ts.findConfigFile(name, ts.sys.fileExists)

    this.fileName = name
    this.content = content
    this.compilerOptions = getCompilerOptions(tsconfig)
  }
  getCurrentDirectory(): string {
    return ts.sys.getCurrentDirectory()
  }
  getDefaultLibFileName(options: ts.CompilerOptions): string {
    return ts.getDefaultLibFileName(options)
  }

  getNewLine() {
    return ts.sys.newLine
  }

  getCompilationSettings() {
    return this.compilerOptions
  }

  getScriptFileNames() {
    return [this.fileName]
  }

  getScriptVersion() {
    return 'V1'
  }

  getScriptSnapshot() {
    return ts.ScriptSnapshot.fromString(this.content)
  }
}
