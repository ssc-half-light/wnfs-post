import { execSync } from 'node:child_process'
import * as process from 'node:process'

const test = process.argv[2] || 'test/index.ts'

execSync(`npx esbuild ${test} --bundle --format=cjs --keep-names > test/test-bundle.js`, {
    stdio: [0, 1, 2]
})
