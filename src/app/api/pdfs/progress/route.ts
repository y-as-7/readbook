import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pdfId, progress, scrollY } = await req.json();

    if (!pdfId) {
      return NextResponse.json({ error: "Missing PDF ID" }, { status: 400 });
    }

    const client = await clientPromise;
    const db = client.db("readbook");

    await db.collection("pdfs").updateOne(
      { _id: new ObjectId(pdfId), userId: (session.user as any).username },
      { $set: { progress, scrollY, updatedAt: new Date() } }
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

    return NextResponse.json(pdf);
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
