# Before install
ONLY SUPPORT ZSH

Please create `.env` file and add `CLI_NAME="*"` first.
Then your cmd will start with CLI_NAME.
```bash
echo "CLI_NAME=\"<YOUR_CLI_NAME>\"" >> .env 
```
For example:

``` dotenv
# .env
CLI_NAME="i-want"
```
After install you can use the cli as
``` shell
i-want vercel preview
```

# Install

To install dependencies:

```bash
echo "CLI_NAME=\"<YOUR_CLI_NAME>\"" >> .env 
bun install
```
