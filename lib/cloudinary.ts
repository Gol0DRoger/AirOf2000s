import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

function seededShuffle<T>(array: T[], seed: number): T[] {
  const arr = [...array];
  let s = seed;
  for (let i = arr.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function getDailyPhotos(count = 21) {
  const result = await cloudinary.api.resources({
    type: 'upload',
    prefix: 'Final-Old/photos',
    max_results: 500,
    resource_type: 'image',
  })

  const total = result.resources.length
  const today = new Date()
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) 
    / 86400000
  )
  // Which "page" of 21 are we on today
  const pageSize = count
  const totalPages = Math.ceil(total / pageSize)
  const currentPage = dayOfYear % totalPages

  // Stable yearly shuffle so order is consistent but not alphabetical
  const seed = today.getFullYear()
  const shuffled = seededShuffle(result.resources, seed)

  // Slice today's 21 from the shuffled array
  const start = currentPage * pageSize
  const slice = shuffled.slice(start, start + pageSize)

  // If near end of array, wrap around
  const final = slice.length < pageSize
    ? [...slice, ...shuffled.slice(0, pageSize - slice.length)]
    : slice

  return final.map((p: any) => ({
    id: p.public_id,
    url: cloudinary.url(p.public_id, {
      transformation: [
        { width: 960, height: 720, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    }),
  }))
}

export async function getAllMusicTracks() {
  const result = await cloudinary.api.resources({
    type: "upload",
    prefix: "Final-Old/music",
    max_results: 200,
    resource_type: "video",
  });
  return result.resources.map((t: unknown) => {
    const track = t as {
      public_id: string;
      context?: { title?: string; artist?: string };
    };
    return {
      id: track.public_id,
      url: cloudinary.url(track.public_id, { resource_type: "video" }),
      title:
        track.context?.title ||
        track.public_id.split("/").pop()?.replace(/_/g, " ") ||
        "Retro Track",
      artist: track.context?.artist || "Unknown Artist",
    };
  });
}

export default cloudinary;
