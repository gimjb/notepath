#!/usr/bin/env node
import { program } from 'commander'
import { version } from '../package.json'
import openFile from './openFile'

program
  .version(version, '-v, --version')
  .option('-c, --char <count>', 'Set max character count for each line', parseInt)
  .argument('[path]', 'Path to the text file')
  .showHelpAfterError()
  .action(async (path: string | undefined, options: { char?: number }) => {
    if (typeof path === 'string') {
      return await openFile(path, options.char ?? 80)
    }
  })
  .parse()
