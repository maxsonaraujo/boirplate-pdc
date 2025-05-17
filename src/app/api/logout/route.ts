import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    // Obter o armazenamento de cookies
    const cookieStore = await cookies()
    
    // Deletar o cookie de token
    cookieStore.delete('token')
    
    return NextResponse.json({ success: true, message: 'Logout realizado com sucesso!' })
  } catch (error) {
    console.error('Erro durante logout:', error)
    return NextResponse.json(
      { success: false, message: 'Erro ao processar logout' },
      { status: 500 }
    )
  }
}
