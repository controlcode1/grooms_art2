/**
 * IndexedDB adapter for portfolio images.
 *
 * localStorage is limited to ~5-10 MB across all keys. A single hi-res photo
 * converted to a WebP data-URL can easily exceed that, causing a silent
 * write failure. IndexedDB supports hundreds of MB, making it the right
 * store for large binary/data-URL blobs.
 */

const DB_NAME = 'grooms_art_db'
const DB_VERSION = 1
const STORE_NAME = 'portfolio_images'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
    request.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result)
    request.onerror = (e) => reject((e.target as IDBOpenDBRequest).error)
  })
}

export interface IdbPortfolioImage {
  id: string
  dataUrl: string
  slug: string
  title: string
  alt: string
  category: string
  partOfFullDay: boolean
  orientation: 'landscape' | 'portrait' | 'square'
  exif: {
    camera: string
    lens: string
    focalLength: string
    aperture: string
    shutter: string
    iso: string
  }
}

export async function idbSaveImage(image: IdbPortfolioImage): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).put(image)
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}

export async function idbGetAllImages(): Promise<IdbPortfolioImage[]> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).getAll()
    request.onsuccess = (e) => resolve((e.target as IDBRequest<IdbPortfolioImage[]>).result)
    request.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}

export async function idbDeleteImage(id: string): Promise<void> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite')
    tx.objectStore(STORE_NAME).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}

export async function idbGetImage(id: string): Promise<IdbPortfolioImage | undefined> {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly')
    const request = tx.objectStore(STORE_NAME).get(id)
    request.onsuccess = (e) => resolve((e.target as IDBRequest<IdbPortfolioImage>).result)
    request.onerror = (e) => reject((e.target as IDBRequest).error)
  })
}
