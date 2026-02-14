import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import cloudinary from "@/lib/cloudinary";

export async function DELETE(req: Request) {
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

    // Get the PDF document to access the Cloudinary public ID
    const pdf = await db.collection("pdfs").findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).username,
    });

    if (pdf && pdf.cloudinaryPublicId) {
      // Delete the file from Cloudinary
      await cloudinary.uploader.destroy(pdf.cloudinaryPublicId, {
        resource_type: "raw"
      });
    }

    await db.collection("pdfs").deleteOne({
      _id: new ObjectId(id),
      userId: (session.user as any).username,
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST method removed - now using direct Cloudinary upload via /api/pdfs/save-metadata

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const client = await clientPromise;
    const db = client.db("readbook");

    const pdfs = await db.collection("pdfs")
      .find({ userId: (session.user as any).username })
      .project({ content: 0 }) // Don't send file content in list
      .toArray();

    return NextResponse.json(pdfs);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
