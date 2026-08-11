// Converts raw source photography into responsive, size-tiered WebP assets.
// Run with: npm run images:optimize
import { readdir, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const SRC_DIR = path.resolve('raw-images')
const OUT_DIR = path.resolve('public/images/portfolio')

// width, suffix, quality
const SIZES = [
  { width: 480, suffix: 'sm', quality: 70 },
  { width: 960, suffix: 'md', quality: 76 },
  { width: 1600, suffix: 'lg', quality: 80 },
]

async function run() {
  if (!existsSync(SRC_DIR)) {
    console.error(`Source folder not found: ${SRC_DIR}`)
    process.exit(1)
  }
  await mkdir(OUT_DIR, { recursive: true })

  const files = (await readdir(SRC_DIR)).filter((f) =>
    /\.(jpe?g|png)$/i.test(f),
  )

  files.sort((a, b) => {
    const na = parseInt(a.match(/photo_(\d+)_/)?.[1] ?? '0', 10)
    const nb = parseInt(b.match(/photo_(\d+)_/)?.[1] ?? '0', 10)
    return na - nb
  })

  let index = 1
  for (const file of files) {
    const srcPath = path.join(SRC_DIR, file)
    const num = parseInt(file.match(/photo_(\d+)_/)?.[1] ?? String(index), 10)
    const slug = `frame-${String(num).padStart(2, '0')}`
    const image = sharp(srcPath).rotate()
    const meta = await image.metadata()

    for (const size of SIZES) {
      const outPath = path.join(OUT_DIR, `${slug}-${size.suffix}.webp`)
      await sharp(srcPath)
        .rotate()
        .resize({ width: size.width, withoutEnlargement: true })
        .webp({ quality: size.quality })
        .toFile(outPath)
    }

    console.log(
      `✓ ${file} -> ${slug} (${meta.width}x${meta.height}) [sm/md/lg webp]`,
    )
    index += 1
  }

  console.log(`\nDone. Optimized ${files.length} images into ${OUT_DIR}`)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
