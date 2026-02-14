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

    // Create upload parameters - only include what needs to be signed
    const uploadParams = {
      timestamp,
      type: "upload",
      access_mode: "public",
      // folder: folder || `readbook/${userId}`,
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
      // folder: uploadParams.folder,
      // resource_type: uploadParams.resource_type,
    });
  } catch (error) {
    console.error("Cloudinary signature error:", error);
    console.error("Environment check:", {
      hasCloudName: !!process.env.CLOUDINARY_CLOUD_NAME,
      hasApiKey: !!process.env.CLOUDINARY_API_KEY,
      hasApiSecret: !!process.env.CLOUDINARY_API_SECRET,
    });
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}