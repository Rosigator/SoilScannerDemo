import { NextResponse, type NextRequest } from "next/server";

export async function POST(req: NextRequest) {
    const payload = await req.json();
    const response = await fetch(process.env.SAND_URL??'', {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
    });
    const data = await response.json();

    return NextResponse.json(data);
}