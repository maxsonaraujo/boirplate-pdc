# Use a imagem Slim baseada em Debian
FROM node:slim

# Definindo a variável de ambiente para o timezone
ENV TZ=America/Sao_Paulo

# Instalando tzdata e openssl para o Prisma
RUN apt-get update && apt-get install -y --no-install-recommends \
    tzdata \
    openssl \
    && ln -fs /usr/share/zoneinfo/America/Sao_Paulo /etc/localtime \
    && dpkg-reconfigure -f noninteractive tzdata \
    && rm -rf /var/lib/apt/lists/*

# Configurando o diretório de trabalho
WORKDIR /degusflow

# Copie apenas os arquivos de dependências para aproveitar o cache
COPY package.json yarn.lock ./

# Ative o Corepack para suporte ao Yarn
RUN corepack enable

# Instale as dependências
RUN yarn install --frozen-lockfile --production

# Copie o restante do código
COPY . .

# Crie o diretório de uploads e configure as permissões
RUN mkdir -p /degusflow/uploads && \
    chmod 777 /degusflow/uploads

ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Definir a variável de ambiente para o diretório de uploads
ENV UPLOAD_DIR=/degusflow/uploads

# Execute a migração do Prisma
RUN npx prisma migrate deploy

RUN npx prisma generate

# Execute o build da aplicação
RUN yarn build

# Exponha a porta
EXPOSE 3000

# Crie um volume para persistir os uploads
VOLUME ["/degusflow/uploads"]

# Comando para iniciar a aplicação
CMD ["yarn", "start"]