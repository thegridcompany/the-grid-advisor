import { NextResponse } from "next/server";
import { GridBriefSchema } from "@/features/sca-ingestion/types";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = GridBriefSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.message },
        { status: 400 }
      );
    }

    // In a real implementation, you would save the data to a database here.
    console.log("SCA data ingested successfully:", result.data);

    return NextResponse.json({
      message: "SCA data ingested successfully",
      data: result.data,
    });
  } catch (error) {
    console.error("Error ingesting SCA data:", error);
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
