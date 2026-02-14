import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import cloudinary from "@/lib/cloudinary";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const publicId = searchParams.get("publicId");
    // const version = searchParams.get("version"); // Not strictly needed for download url but good practice

    if (!publicId) {
      return NextResponse.json({ error: "Missing publicId" }, { status: 400 });
    }

    // Generate Private Download URL
    // This uses the API endpoint (api.cloudinary.com) instead of the delivery endpoint (res.cloudinary.com)
    // and signs the request with api_key/secret, bypassing standard delivery ACLs.
    const downloadUrl = cloudinary.utils.private_download_url(publicId, "", {
      resource_type: "raw",
      type: "upload",
      // version: version, // format usually handled by public_id extension
      // expires_at: Math.floor(Date.now() / 1000) + 3600, // Valid for 1 hour
    });

    console.log("Fetching Private Download URL:", downloadUrl);

    const response = await fetch(downloadUrl);

    if (!response.ok) {
       console.error("Proxy fetch failed:", response.status, response.statusText);
       const text = await response.text();
       console.error("Error body:", text);
       return NextResponse.json({ error: "Failed to fetch PDF", details: text }, { status: response.status });
    }

    const headers = new Headers(response.headers);
    headers.set("Content-Disposition", "inline"); 
    headers.set("Content-Type", "application/pdf");

    return new NextResponse(response.body, {
      status: 200,
      headers: headers,
    });

  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
