import fs from 'node:fs/promises'
import path from 'node:path'
import readline from 'node:readline'
import chalk from 'chalk'
import config from './config'
import openFile from './openFile'

interface PreviousFile {
  absolutePath: string
  processedPath: string
  lineIndex: number
  notFound?: boolean
}

const items: PreviousFile[] = []
let activeItem = 0

function render (): void {
  console.clear()
  console.log('Previously opened files:')
  items.forEach((item, index) => {
    const prefix = index === activeItem ? '> ' : '  '
    const filePath =
      index === activeItem
        ? chalk.underline.whiteBright(item.processedPath)
        : item.processedPath
    const line =
      index === activeItem
        ? chalk.underline.white(`:${item.lineIndex + 1}`)
        : chalk.gray(`:${item.lineIndex + 1}`)
    const suffix = item.notFound === true ? chalk.red(' (not found)') : ''
    console.log(
      `${prefix}${
        item.notFound === true
          ? chalk.strikethrough(filePath + line)
          : filePath + line
      }${suffix}`
    )
  })
}

export default function dashboard (char = 80): void {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true
  })

  const homePath = process.env['HOME'] ?? process.env['USERPROFILE'] ?? ''
  const homeRegex = new RegExp(`^${homePath?.replace(/([.*+?^=!:${}()|[\]/\\])/g, '\\$1')}`)
  config.files.forEach(file => {
    const relativePath = path.relative(process.cwd(), file.path)
    const item: PreviousFile = {
      absolutePath: file.path,
      processedPath:
        relativePath.startsWith('..') && homePath !== ''
          ? file.path.replace(homeRegex, '~')
          : relativePath,
      lineIndex: file.lineIndex
    }

    items.push(item)

    fs.access(file.path)
      .catch(() => {
        item.notFound = true
        render()
      })
  })

  render()

  function keypress (_: string, key: any): void {
    if (key.name === 'up') {
      activeItem = Math.max(0, activeItem - 1)
      return render()
    }

    if (key.name === 'down') {
      activeItem = Math.min(items.length - 1, activeItem + 1)
      return render()
    }

    if (key.name === 'return') {
      const item = items[activeItem]

      rl.close()
      process.stdin.off('keypress', keypress)

      if (typeof item === 'undefined' || item.notFound === true) {
        // Todo(gimjb): Implement a way to remove or correct deleted files.
        throw new Error('File has been deleted')
      }

      void openFile(item.absolutePath, char)
    }

    if (key.name === 'q') {
      rl.close()
    }
  }

  process.stdin.on('keypress', keypress)
}
