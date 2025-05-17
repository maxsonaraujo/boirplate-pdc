const withPlugins = require("next-compose-plugins");
/** @type {import('next').NextConfig} */
const withFonts = require("next-fonts");
const path = require("path");
const fs = require("fs");

// Garantir que o diretório de uploads exista
const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
    console.log('Diretório de uploads criado:', uploadsDir);
  }
} catch (error) {
  console.error('Erro ao verificar/criar diretório de uploads:', error);
}

const nextConfig = {
  // async rewrites() {
  //   return [
  //     {
  //       source: "/",
  //       destination: 'http://127.0.0.1:' + portAletoria,
  //     },
  //   ]
  // }

  // eslint: {
  //   // Warning: This allows production builds to successfully complete even if
  //   // your project has ESLint errors.
  //   ignoreDuringBuilds: true,
  // }

  // Configurar o limite de tamanho do corpo das requisições
  serverRuntimeConfig: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
  
  // Configuração para uploads
  experimental: {
    largePageDataBytes: 128 * 1000, // 128KB por padrão
  },
  
  // Garantir que os arquivos estáticos sejam servidos corretamente
  // mesmo em desenvolvimento
  webpack: (config, { isServer, dev }) => {
    // Se estivermos no cliente e em desenvolvimento, garantir
    // que as imagens da pasta uploads sejam tratadas corretamente
    if (!isServer && dev) {
      console.log('Configurando webpack para servir uploads em desenvolvimento');
    }
    return config;
  },
  
  // Importante: isso faz com que o Next.js considere os uploads como parte dos arquivos estáticos
  images: {
    domains: ['localhost'],
    remotePatterns: [
      {
        protocol: 'http',
        hostname: '**',
      },
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  
  // Garantir que a pasta public seja servida corretamente
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : undefined,
};

module.exports = withPlugins(
  [
    [withFonts],
    // your plugins go here.
    
  ],
  nextConfig
);
