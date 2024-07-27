#!/usr/bin/env node
import path from 'node:path'
import { program } from 'commander'
import { version } from '../package.json'
import dashboard from './dashboard'
import openFile from './openFile'

program
  .version(version, '-v, --version')
  .option('-c, --char <count>', 'Set max character count for each line', parseInt)
  .argument('[path]', 'Path to the text file', (filePath: string) => path.resolve(process.cwd(), filePath))
  .showHelpAfterError()
  .action(async (filePath: string | undefined, options: { char?: number }) => {
    if (typeof filePath === 'string') {
      return await openFile(filePath, options.char ?? 80)
    }

    return dashboard()
  })
  .parse()
