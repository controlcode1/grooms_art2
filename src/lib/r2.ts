import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createServerFn } from '@tanstack/react-start'

// Cloudflare R2 credentials (server-side only)
const accountId = process.env.R2_ACCOUNT_ID
const accessKeyId = process.env.R2_ACCESS_KEY_ID
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY
const bucketName = process.env.R2_BUCKET_NAME
const publicUrl = process.env.R2_PUBLIC_URL

// Initialize S3 client using Cloudflare R2 endpoint
const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: accessKeyId || '',
    secretAccessKey: secretAccessKey || '',
  },
})

/**
 * Server Function: Generates a presigned PUT URL to upload a file directly to Cloudflare R2.
 * Expired in 5 minutes.
 */
export const getPresignedUploadUrl = createServerFn({ method: 'POST' })
  .validator((input: { filename: string; contentType: string }) => input)
  .handler(async ({ data }) => {
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('[r2] Cloudflare R2 environment variables are not fully configured.')
    }

    const { filename, contentType } = data

    // Clean name and prefix to prevent collisions
    const sanitized = filename.replace(/[^a-zA-Z0-9.-]/g, '_')
    const key = `portfolio/${Date.now()}-${sanitized}`

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: contentType,
    })

    // Generate upload URL (valid for 5 minutes)
    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 })

    // Build the public access URL
    let formattedPublicUrl = publicUrl ? publicUrl.trim() : ''
    if (formattedPublicUrl && !formattedPublicUrl.startsWith('http://') && !formattedPublicUrl.startsWith('https://')) {
      formattedPublicUrl = `https://${formattedPublicUrl}`
    }

    const baseUrl = formattedPublicUrl
      ? (formattedPublicUrl.endsWith('/') ? formattedPublicUrl : `${formattedPublicUrl}/`)
      : `https://${bucketName}.${accountId}.r2.dev/`
    const fileUrl = `${baseUrl}${key}`

    return {
      uploadUrl,
      fileUrl,
      key,
    }
  })

/**
 * Server Function: Deletes an object from Cloudflare R2 using its key.
 */
export const deleteFromR2 = createServerFn({ method: 'POST' })
  .validator((input: { key: string }) => input)
  .handler(async ({ data }) => {
    if (!accountId || !accessKeyId || !secretAccessKey || !bucketName) {
      throw new Error('[r2] Cloudflare R2 environment variables are not fully configured.')
    }

    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: data.key,
    })

    await s3Client.send(command)
    return { success: true }
  })
