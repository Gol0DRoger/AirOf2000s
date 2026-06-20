/**
 * ============================================================
 * RETRO NOSTALGIA SITE — CLOUDINARY FETCH UTILITIES
 * ============================================================
 * Drop this file into your Next.js project:
 * → /lib/cloudinary.js
 *
 * Usage in your components:
 * import { getDailyPhotos, getDailyTrack } from '@/lib/cloudinary'
 * ============================================================
 */

import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// ── Get 7 photos for today's slideshow ──────────────────────
// Same 7 photos all day. Different 7 every day.
// Uses date as seed so it's deterministic — no DB needed
export async function getDailyPhotos(count = 7) {
  try {
    // Fetch your full photo library from Cloudinary
    const result = await cloudinary.api.resources({
      type:        'upload',
      prefix:      'retro-nostalgia/photos',
      max_results: 500,
      resource_type: 'image',
    })

    const allPhotos = result.resources

    // Generate today's seed from date
    const today = new Date()
    const seed  = today.getFullYear() * 10000 +
                  (today.getMonth() + 1) * 100 +
                  today.getDate()

    // Deterministic shuffle using seed
    const shuffled = seededShuffle(allPhotos, seed)

    // Return first 7 with Cloudinary transformation URLs
    return shuffled.slice(0, count).map(photo => ({
      id:  photo.public_id,
      // Vintage grain effect applied automatically via URL
      url: cloudinary.url(photo.public_id, {
        transformation: [
          { width: 1400, height: 800, crop: 'fill', gravity: 'auto' },
          { effect: 'sepia:30'  },
          { effect: 'grain:25'  },
          { effect: 'vignette:40' },
          { quality: 'auto', fetch_format: 'auto' },
        ],
      }),
      // Clean version for thumbnails
      thumbUrl: cloudinary.url(photo.public_id, {
        transformation: [
          { width: 400, height: 250, crop: 'fill' },
          { effect: 'sepia:20', quality: 'auto' },
        ],
      }),
      tags:   photo.tags || [],
      source: photo.context?.source || 'unknown',
    }))

  } catch (err) {
    console.error('Cloudinary photos fetch error:', err)
    return []
  }
}

// ── Get today's music track ───────────────────────────────────
// One track per day, rotates through your library
export async function getDailyTrack() {
  try {
    const result = await cloudinary.api.resources({
      type:          'upload',
      prefix:        'retro-nostalgia/music',
      max_results:   100,
      resource_type: 'video', // Cloudinary stores audio as "video" type
    })

    const allTracks = result.resources
    if (!allTracks.length) return null

    // Same track all day, new one tomorrow
    const today     = new Date()
    const dayOfYear = Math.floor(
      (today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
    )
    const trackIndex = dayOfYear % allTracks.length
    const track      = allTracks[trackIndex]

    return {
      id:    track.public_id,
      url:   cloudinary.url(track.public_id, { resource_type: 'video' }),
      title: track.context?.title  || 'Retro Track',
      artist: track.context?.artist || 'Unknown Artist',
    }

  } catch (err) {
    console.error('Cloudinary music fetch error:', err)
    return null
  }
}

// ── Seeded shuffle — same result for same seed ───────────────
function seededShuffle(array, seed) {
  const arr = [...array]
  let   s   = seed

  for (let i = arr.length - 1; i > 0; i--) {
    s         = (s * 1103515245 + 12345) & 0x7fffffff
    const j   = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]]
  }

  return arr
}

export default cloudinary
