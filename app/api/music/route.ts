import { getAllMusicTracks } from "@/lib/cloudinary";

export const revalidate = 86400;

export async function GET() {
  try {
    const tracks = await getAllMusicTracks();
    return Response.json(tracks);
  } catch {
    return Response.json([]);
  }
}
