import { format } from "date-fns";
import { createVSIX } from "vsce";
import { name, version } from "../package.json";

createVSIX({
  packagePath: `./${name}-${version}-${format(new Date(), "yyyy-MM-dd-HH-mm-ss")}.vsix`,
});
