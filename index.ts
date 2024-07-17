import { ifArgv } from 'help/io.ts'

import { main as linear } from '@/src/linear'
import { main as vercel } from '@/src/vercel'

ifArgv('linear') && linear()
ifArgv('vercel') && vercel()