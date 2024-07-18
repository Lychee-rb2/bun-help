import { z } from 'zod'

export { z } from 'zod'

export const numString = () => z.preprocess(
  (i) => +z.string().parse(i),
  z.number()
)

