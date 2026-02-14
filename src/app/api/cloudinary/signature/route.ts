import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { folder } = await req.json();

    const timestamp = Math.round(new Date().getTime() / 1000);
    const userId = (session.user as any).username;

    // Create upload parameters
    const uploadParams = {
      timestamp,
      folder: folder || `readbook/${userId}`,
      resource_type: "raw" as const, // For PDF files
    };

    // Generate signature
    const signature = cloudinary.utils.api_sign_request(
      uploadParams,
      process.env.CLOUDINARY_API_SECRET!
    );

    return NextResponse.json({
      signature,
      timestamp,
      api_key: process.env.CLOUDINARY_API_KEY,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      folder: uploadParams.folder,
    });
  } catch (error) {
    console.error("Cloudinary signature error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}