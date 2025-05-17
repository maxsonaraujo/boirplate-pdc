import { db } from "@/db/connector";
import jwt from "jsonwebtoken";

export const getUsuarioFromJwt = async (token: string) => {
    try {
        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
        const usuarioId = decodedToken['id'];
        const usuario = await db.user.findUnique({
            where: { id: usuarioId },
            include: {
                tenant: true,
            },
        });
        return usuario;
    } catch (error) {
        console.error('Erro ao decodificar o token JWT:', error);
        return null;
    }
}