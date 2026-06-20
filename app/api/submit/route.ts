import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import crypto from "crypto";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Simple in-memory rate limit storage
const submitRateLimit = new Map<string, { count: number; resetTime: number }>();

function hashIP(ip: string): string {
  const salt = process.env.IP_SALT || "default_salt";
  return crypto.createHash("sha256").update(ip + salt).digest("hex");
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const year = formData.get("year") as string;
    const location = formData.get("location") as string;

    // Validate file
    if (!file) {
      return NextResponse.json({ error: "Photo is required" }, { status: 400 });
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Photo must be less than 5MB" }, { status: 400 });
    }

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Photo must be an image file" }, { status: 400 });
    }

    // Validate year
    if (!year || !/^(200[1-9]|2010)$/.test(year)) {
      return NextResponse.json({ error: "Invalid year" }, { status: 400 });
    }

    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
    const hashedIP = hashIP(ip);
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    const userLimit = submitRateLimit.get(hashedIP);
    
    if (userLimit) {
      if (now > userLimit.resetTime) {
        // Reset if day has passed
        submitRateLimit.set(hashedIP, { count: 1, resetTime: now + dayInMs });
      } else if (userLimit.count >= 3) {
        return NextResponse.json({ error: "Maximum 3 submissions per day" }, { status: 429 });
      } else {
        userLimit.count++;
      }
    } else {
      submitRateLimit.set(hashedIP, { count: 1, resetTime: now + dayInMs });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: "Final-Old/pending",
          resource_type: "image",
          context: {
            title: year,
            caption: location || "",
          },
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(buffer);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Submit error:", error);
    return NextResponse.json({ error: "Submission failed" }, { status: 500 });
  }
}
