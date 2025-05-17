import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useCookies } from 'react-cookie';

interface User {
  id: number;
  name: string;
  email: string;
  image?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cookies, setCookie, removeCookie] = useCookies(['token']);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      if (!cookies.token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/auth/me');
        if (response.ok) {
          const userData = await response.json();
          setUser(userData.user);
        } else {
          // Token inválido ou expirado
          removeCookie('token', { path: '/' });
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [cookies.token, removeCookie]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao fazer login');
      }

      // Salvar token nos cookies
      setCookie('token', data.token, { path: '/', maxAge: 86400 }); // 24 horas
      setUser(data.user);
      router.push('/desk');
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante o login');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    removeCookie('token', { path: '/' });
    setUser(null);
    router.push('/login');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}
