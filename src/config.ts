import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import path from 'node:path'

const configPath = (() => {
  const fileName = 'config.json'

  switch (process.platform) {
    case 'darwin':
      return path.join(process.env['HOME'] ?? __dirname, 'Library', 'Application Support', 'notepath', fileName)
    case 'win32':
      return path.join(process.env['APPDATA'] ?? __dirname, 'notepath', fileName)
    default:
      return path.join(process.env['HOME'] ?? __dirname, '.config', 'notepath', 'config')
  }
})()

/** A previously opened file. */
interface File {
  /** Path to the file. */
  path: string
  /** The saved scroll position from the last time the file was opened. */
  lineIndex: number
}

/** The structure of the config file. */
interface ConfigDocument {
  /** List of files that have previously been opened. */
  files: File[]
}

/** Saved data for the application. */
class Config {
  /** Path to the config file. */
  public readonly path = configPath
  /** The configuration data. */
  private readonly config: ConfigDocument = { files: [] }

  /** List of files that have previously been opened. */
  public get files (): File[] {
    return this.config.files
  }

  public set files (files: File[]) {
    this.config.files = files
  }

  public constructor (options: Partial<ConfigDocument> = {}) {
    this.config = { ...this.config, ...options }
  }

  /** Load the configuration from the file system. */
  public static load (): Config {
    if (!fsSync.existsSync(configPath)) {
      fsSync.mkdirSync(path.dirname(configPath), { recursive: true })
      return new Config()
    }

    return new Config(JSON.parse(fsSync.readFileSync(configPath, 'utf-8')))
  }

  /**
   * Get saved data about a file by its path.
   *
   * @param path - Path to the file.
   * @returns The saved data about the file, or `null` if the file has not been opened before.
   */
  public getFile (path: string): File | null {
    return this.config.files.find(file => file.path === path) ?? null
  }

  /**
   * Set data about a file.
   *
   * @param file - Data about the file.
   * @returns The instance of the `Config` class.
   */
  public setFile (file: File): Config {
    const existingFile = this.getFile(file.path)

    if (existingFile !== null) {
      existingFile.lineIndex = file.lineIndex
      return this
    }

    this.config.files.push(file)
    return this
  }

  /** Save the configuration to the file system. */
  public async save (): Promise<Config> {
    await fs.writeFile(configPath, JSON.stringify(this.config, null, 2))
    return this
  }
}

/** Saved data for the application. */
export default Config.load()
