import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { put, del } from "@vercel/blob";

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

    // Get the PDF document to access the blob URL
    const pdf = await db.collection("pdfs").findOne({
      _id: new ObjectId(id),
      userId: (session.user as any).username,
    });

    if (pdf && pdf.blobUrl) {
      // Delete the blob from Vercel Blob storage
      await del(pdf.blobUrl);
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

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;
    const title = formData.get("title") as string;
    const coverImage = formData.get("coverImage") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Upload file to Vercel Blob
    const blob = await put(file.name, file, {
      access: 'public',
    });

    const client = await clientPromise;
    const db = client.db("readbook");

    const result = await db.collection("pdfs").insertOne({
      userId: (session.user as any).username,
      title: title || file.name,
      fileName: file.name,
      blobUrl: blob.url,
      fileSize: file.size,
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
