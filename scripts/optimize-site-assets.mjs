/**
 * Optimize site assets for maximum performance:
 *  1. Convert all public/images/*.jpg to *.webp
 *  2. Compress public/videos/hero.mp4 using ffmpeg (H.264 + WebM)
 *
 * Run with: node scripts/optimize-site-assets.mjs
 */
import { readdir } from 'node:fs/promises'
import { existsSync, statSync } from 'node:fs'
import { execSync } from 'node:child_process'
import path from 'node:path'
import sharp from 'sharp'

const IMAGES_DIR = path.resolve('public/images')
const VIDEOS_DIR = path.resolve('public/videos')

async function optimizeImages() {
  console.log('\n📸 Optimizing images...')
  const files = (await readdir(IMAGES_DIR)).filter((f) =>
    /\.(jpe?g)$/i.test(f),
  )
  if (files.length === 0) { console.log('   No JPG files found.'); return }

  for (const file of files) {
    const srcPath = path.join(IMAGES_DIR, file)
    const basename = path.basename(file, path.extname(file))
    const webpPath = path.join(IMAGES_DIR, `${basename}.webp`)
    if (existsSync(webpPath)) { console.log(`   skip ${file} (webp exists)`); continue }

    const beforeSize = statSync(srcPath).size
    await sharp(srcPath).webp({ quality: 82, effort: 6 }).toFile(webpPath)
    const afterSize = statSync(webpPath).size
    const savedKB = ((beforeSize - afterSize) / 1024).toFixed(0)
    const savePct = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(0)
    console.log(`   OK ${file} -> ${basename}.webp  (saved ${savedKB}KB / ${savePct}%)`)
  }
}

async function optimizeVideo() {
  console.log('\n🎬 Optimizing hero video...')
  const srcMp4 = path.join(VIDEOS_DIR, 'hero.mp4')
  const outMp4 = path.join(VIDEOS_DIR, 'hero.compressed.mp4')
  const outWebm = path.join(VIDEOS_DIR, 'hero.webm')

  if (!existsSync(srcMp4)) { console.log('   No hero.mp4 found.'); return }

  let ffmpegBin
  try {
    const { default: ffmpegPath } = await import('ffmpeg-static')
    ffmpegBin = ffmpegPath
  } catch {
    console.warn('   ffmpeg-static not found. Skipping video compression.')
    return
  }

  const beforeSize = statSync(srcMp4).size
  console.log(`   Original: ${(beforeSize / 1024 / 1024).toFixed(2)} MB`)

  if (!existsSync(outMp4)) {
    console.log('   Compressing MP4 (CRF 28, max 1280px)...')
    execSync(
      `"${ffmpegBin}" -i "${srcMp4}" -vcodec libx264 -crf 28 -preset fast -vf "scale=min(1280\\,iw):-2" -movflags +faststart -an "${outMp4}" -y`,
      { stdio: 'inherit' },
    )
    const afterSize = statSync(outMp4).size
    const savedMB = ((beforeSize - afterSize) / 1024 / 1024).toFixed(2)
    const savePct = (((beforeSize - afterSize) / beforeSize) * 100).toFixed(0)
    console.log(`   OK hero.compressed.mp4  saved ${savedMB} MB (${savePct}%)`)
  } else {
    console.log('   hero.compressed.mp4 already exists, skipping.')
  }

  if (!existsSync(outWebm)) {
    console.log('   Encoding WebM VP9...')
    execSync(
      `"${ffmpegBin}" -i "${srcMp4}" -vcodec libvpx-vp9 -crf 35 -b:v 0 -vf "scale=min(1280\\,iw):-2" -an "${outWebm}" -y`,
      { stdio: 'inherit' },
    )
    const webmSize = statSync(outWebm).size
    console.log(`   OK hero.webm (${(webmSize / 1024 / 1024).toFixed(2)} MB)`)
  } else {
    console.log('   hero.webm already exists, skipping.')
  }

  console.log('\n   NEXT: rename hero.compressed.mp4 -> hero.mp4 if it looks good')
}

async function run() {
  console.log('=== Grooms Art Asset Optimizer ===')
  await optimizeImages()
  await optimizeVideo()
  console.log('\n=== Done ===')
}

run().catch((err) => { console.error(err); process.exit(1) })

