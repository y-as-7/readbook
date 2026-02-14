import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

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

    await db.collection("pdfs").deleteOne({
      _id: new ObjectId(id),
      userId: (session.user as any).username,
    });

    return NextResponse.json({ message: "Deleted successfully" });
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check content-length header before processing
    const contentLength = req.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 50 * 1024 * 1024) {
      return NextResponse.json({
        error: "File too large. Maximum size is 50MB."
      }, { status: 413 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const coverImage = formData.get("coverImage") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Convert file to base64 for simplicity in this demo (MongoDB has 16MB limit)
    // For production, use S3 or GridFS
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Content = buffer.toString("base64");

    const client = await clientPromise;
    const db = client.db("readbook");

    const result = await db.collection("pdfs").insertOne({
      userId: (session.user as any).username,
      title: title || file.name,
      fileName: file.name,
      content: base64Content,
      coverImage: coverImage || null,
      progress: 0,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Upload successful", id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
