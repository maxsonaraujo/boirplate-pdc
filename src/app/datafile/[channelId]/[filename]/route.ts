import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }) {
    const { filename, channelId } = params;

    try {
        const response = await axios.get(`/public/${filename}`, {
            responseType: "arraybuffer", // Define o tipo de resposta como arraybuffer para arquivos binários
        });

        const contentType = response.headers["content-type"] || "application/octet-stream"; // Define o tipo de conteúdo, se disponível

        return new Response(response.data, {
            headers: {
                "Content-Type": contentType,
                "Cache-Control": "no-store",
            },
            status: response.status,
        });
    } catch (error) {
        console.error("Erro ao buscar arquivo:", error);
        return NextResponse.json({ error: "Erro ao buscar arquivo" }, { status: 500 });
    }
}
