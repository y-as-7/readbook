import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, fileName, blobUrl, fileSize, coverImage } = await req.json();

    if (!title || !fileName || !blobUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("readbook");

    const result = await db.collection("pdfs").insertOne({
      userId: (session.user as any).username,
      title,
      fileName,
      blobUrl,
      fileSize,
      coverImage: coverImage || null,
      progress: 0,
      createdAt: new Date(),
    });

    return NextResponse.json({ message: "Metadata saved successfully", id: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("Save metadata error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}