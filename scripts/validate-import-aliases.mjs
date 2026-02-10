import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'

const ROOT_DIR = process.cwd()
const SCAN_ROOTS = ['apps', 'packages']
const ALLOWED_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.vue'])
const SKIP_DIRS = new Set(['node_modules', 'dist', '.git'])

const forbiddenMatchers = [
  {
    alias: '@/',
    test: (line) => line.includes("'@/") || line.includes('"@/'),
    hint: 'Use "@app/*" for app-local code or "@repo/*" for package code.',
  },
  {
    alias: '@utils/',
    test: (line) => line.includes("'@utils/") || line.includes('"@utils/'),
    hint: 'Use package-level imports such as "@repo/<pkg>/...".',
  },
  {
    alias: '@lib/',
    test: (line) => line.includes("'@lib/") || line.includes('"@lib/'),
    hint: 'Use package-level imports such as "@repo/<pkg>/...".',
  },
]

async function walk(dirPath, files) {
  const entries = await readdir(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) {
        await walk(path.join(dirPath, entry.name), files)
      }
      continue
    }

    const extension = path.extname(entry.name)
    if (ALLOWED_EXTENSIONS.has(extension)) {
      files.push(path.join(dirPath, entry.name))
    }
  }
}

async function main() {
  const sourceFiles = []
  for (const root of SCAN_ROOTS) {
    await walk(path.join(ROOT_DIR, root), sourceFiles)
  }

  const violations = []
  for (const filePath of sourceFiles) {
    const text = await readFile(filePath, 'utf8')
    const lines = text.split(/\r?\n/)
    lines.forEach((line, index) => {
      for (const matcher of forbiddenMatchers) {
        if (matcher.test(line)) {
          violations.push({
            filePath: path.relative(ROOT_DIR, filePath).replaceAll('\\', '/'),
            line: index + 1,
            alias: matcher.alias,
            hint: matcher.hint,
          })
        }
      }
    })
  }

  if (violations.length === 0) {
    console.log('Alias validation passed: no forbidden aliases found.')
    return
  }

  console.error('Alias validation failed:')
  for (const item of violations) {
    console.error(`- ${item.filePath}:${item.line} contains "${item.alias}". ${item.hint}`)
  }
  process.exit(1)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
