import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import cloudinary from "@/lib/cloudinary";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pdfId, progress, scrollY, markerPos } = await req.json();

    if (!pdfId) {
      return NextResponse.json({ error: "Missing PDF ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("readbook");

    await db.collection("pdfs").updateOne(
      { _id: new ObjectId(pdfId), userId: (session.user as any).username },
      { $set: { progress, scrollY, markerPos, updatedAt: new Date() } }
    );

    return NextResponse.json({ message: "Progress updated" });
  } catch (error) {
    console.error("Progress update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("readbook");

    const pdf = await db.collection("pdfs").findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).username
    });

    if (!pdf) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Generate signed URL if public ID is available
    if (pdf.cloudinaryPublicId) {
      try {
        // Extract version from existing URL if possible
        // Expected format: .../v12345678/...
        const versionMatch = pdf.cloudinaryUrl ? pdf.cloudinaryUrl.match(/\/v(\d+)\//) : null;
        const version = versionMatch ? versionMatch[1] : undefined;



        // Construct proxy URL with publicId and version
        // The proxy will handle generating the private download URL
        const proxyUrl = `/api/pdfs/serve?publicId=${encodeURIComponent(pdf.cloudinaryPublicId)}&version=${version || ""}`;

        pdf.cloudinaryUrl = proxyUrl;
      } catch (e) {
        console.error("Error generating signed URL:", e);
        // Fallback to existing URL
      }
    }

    return NextResponse.json(pdf);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
