import { ifArgv } from 'help/io.ts'

import { main as linear, argv as linearArgv } from '@/src/linear'
import { main as vercel, argv as vercelArgv } from '@/src/vercel'

ifArgv(linearArgv) && linear()
ifArgv(vercelArgv) && vercel()