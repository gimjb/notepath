import fs from 'node:fs/promises'
import readline from 'node:readline'
import chalk from 'chalk'

function completer (line: string): readline.CompleterResult {
  const completions = [':q']

  const hits = completions.filter(c => c.startsWith(line))

  return [hits.length >= 1 ? hits : completions, line]
}

interface Line {
  content: string
  line: number
}

const padding = 4
const paddingStr = ' '.repeat(padding + 2)

function format (lines: Line[], char = 80, query: string[] = []): string {
  return lines.map(line => {
    const words: string[] = line.content.split(/(\b)/)

    let result: string = chalk.gray(line.line.toString().padStart(padding) + '  ')
    let lineLength: number = paddingStr.length

    for (const word of words) {
      if (word === '') continue
      if (lineLength + word.length > char) {
        result += `\n${paddingStr}`
        lineLength = paddingStr.length
      }

      result += query.includes(word.toLowerCase()) ? chalk.hex('#ff4488').bold(word) as string : word
      lineLength += word.length + 1
    }

    return result
  }).join('\n')
}

function search (lines: Line[], query: string[]): Line[] {
  return lines.filter(line => query.every(q => line.content.toLowerCase().includes(q)))
}

let lineIndex = 0

function render (lines: Line[], char = 80, query: string[] = []): void {
  const range = [lineIndex, Math.min(lineIndex + process.stdout.rows - 3, lines.length)]
  console.clear()
  console.log(
    format(lines.slice(range[0], range[1]), char, query)
      .split('\n').slice(0, process.stdout.rows - 1).join('\n')
  )
}

export default async function openFile (path: string, char = 80): Promise<void> {
  const data = await fs.readFile(path, 'utf-8')

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    completer,
    terminal: true
  })

  const lines: Line[] = data.split('\n').map((content, index) => {
    return {
      content,
      line: index + 1
    }
  })

  render(lines, char)

  let query: string[] = []
  let results: Line[] = lines

  process.stdin.on('keypress', (str, key) => {
    if (key.name === 'up') {
      lineIndex = Math.max(0, lineIndex - 1)
      return render(results, char, query)
    }

    if (key.name === 'down') {
      lineIndex = Math.min(lines.length - 1, lineIndex + 1)
      return render(results, char, query)
    }
  })

  rl.on('line', input => {
    if (input === ':q') {
      return rl.close()
    }

    if (input === '') {
      lineIndex = (results[lineIndex]?.line ?? 1) - 1
      results = lines
      query = []
      return render(lines, char)
    }

    const goto = parseInt(input.slice(1))

    if (goto > 0) {
      lineIndex = goto - 1
      query = []
      results = lines
      return render(results, char)
    }

    lineIndex = 0
    query = input.toLowerCase().split(/\s+/)
    results = search(lines, query)
    render(results, char, query)
  })
}
