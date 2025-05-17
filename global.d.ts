import { env } from "process"; 654

// global.d.ts
declare global {
    var __DEV__: boolean;
    var BACKEND_WAPI_TOKEN: string;
    var BASE_URL: string;

    namespace NodeJS {
        interface ProcessEnv {
            // NODE_ENV: 'development' | 'production';
            JWT_SECRET: string
            // Adicione outras variáveis ​​de ambiente conforme necessário
        }
    }
    // Declaração de variáveis ou funções globais
    const minhaVariavelGlobal: string;
    function minhaFuncaoGlobal(param: string): void;
}

export { }