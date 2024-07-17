import { ifArgv } from 'help/io.ts'
import { main as vercel } from '@/src/vercel'
import { main as linear } from '@/src/linear'

ifArgv('vercel') && vercel()
ifArgv('linear') && linear()

