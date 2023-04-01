import { execSync } from 'node:child_process'
import * as process from 'node:process'

const test = process.argv[2] || 'test/index.ts'

execSync(`npm run build-tests -- ${test} && cat test/index.html | npx tape-run --input=html --static=test | npx tap-arc`, {
    stdio: [0, 1, 2]
})
