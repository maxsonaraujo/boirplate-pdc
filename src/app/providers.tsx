// app/providers.tsx
'use client'

import { CacheProvider } from '@chakra-ui/next-js'
import { ChakraProvider, ColorModeScript } from '@chakra-ui/react'

import { extendTheme } from "@chakra-ui/react"
import StoreProvider from './StoreProvider'
import { Suspense, useEffect, useState } from 'react'

const classic = extendTheme({
  colors: {
    "b": {
      "green": "#008069",
      "dark": "#1c1e21",
      "darklight": "#202c33",
      "darkgreen": "#00a884",
      "lightgreen": "#4ada80",
      "blue": "#009de2",
    },
    "painel": {
      "barraL": '##f0f2f5',
      "barraD": '#202c33',
      "iconActiveL": "#86a3b3",
      "iconActiveD": "#667781",
      "iconL": "#202c33",
      "iconD": "white",
    },
    "primary": {
      50: "#E6F4EA",
      100: "#CCE9D5",
      200: "#99D3AB",
      300: "#66BD82",
      400: "#33A858", // Verde claro do WhatsApp
      500: "#25D366", // Verde principal do WhatsApp
      600: "#20B557",
      700: "#1A9047",
      800: "#146C37",
      900: "#0E4826",
    },
    "bl": {
      "gelosec": "#86a3b3",
      "gelomd": "#dacfbd79",
      "gelo": "#f0f2f5",
      "painel": "#ffffff",
      "chat": "#dacfbdff",
      "painelI": "#ffffffbf",
      "green": "#d9fdd3ff"
    },
    "bd": {
      "gelosec": "#667781",
      "gelomd": "#111b21bf",
      "gelo": "#202c33",
      "painel": "#111b21",
      "chat": "#111b21",
      "painelI": "#0b141aed",
      "green": "#005c4bff"
    },
    "whatsapp": {
      "100": "#E9F5DC",
      "200": "#D1EFB7",
      "300": "#B1E08B",
      "400": "#8FCB57",
      "500": "#34B27A",
      "600": "#259563",
      "700": "#19774F",
      "800": "#0E583B",
      "900": "#063926",
      "df": "#008069"
    }
  },
})

const blueTheme = extendTheme({
  colors: {
    "b": {
      "green": "#0066cc",  // Substituindo o verde pelo azul
      "dark": "#1c1e21",
      "darklight": "#202c33",
      "darkgreen": "#0080ff", // Substituindo o verde escuro pelo azul escuro
      "lightgreen": "#66b3ff", // Substituindo o verde claro pelo azul claro
      "blue": "#0073e6",
    },
    "bl": {
      "gelosec": "#86a3b3",
      "gelomd": "#dacfbd79",
      "gelo": "#f0f2f5",
      "painel": "#ffffff",
      "chat": "#dacfbdff",
      "painelI": "#ffffffbf",
      "green": "#cce5ff" // Substituindo o verde claro pelo azul claro
    },
    "painel": {
      "barraL": '#202C39',
      "barraD": '#202C39',
      "iconActiveL": "#86a3b3",
      "iconActiveD": "#667781",
      "iconL": "#cce5ff",
      "iconD": "#cce5ff",
    },
    "primary": {
      50: "#ebf8ff",
      100: "#bee3f8",
      200: "#90cdf4",
      300: "#63b3ed",
      400: "#4299e1",
      500: "#3182ce",  // Azul principal
      600: "#2b6cb0",
      700: "#2c5282",
      800: "#2a4365",
      900: "#1A365D",
    },
    "bd": {
      "gelosec": "#667781",
      "gelomd": "#111b21bf",
      "gelo": "#202C39",
      "painel": "#111b21",
      "chat": "#111b21",
      "painelI": "#0b141aed",
      "green": "#004c99" // Substituindo o verde escuro pelo azul escuro
    },
    "whatsapp": {
      "100": "#DCEFFF", // Tons de azul
      "200": "#B7DFFF",
      "300": "#8BCCFF",
      "400": "#57B7FF",
      "500": "#2A92FF",
      "600": "#1C73CC",
      "700": "#135599",
      "800": "#0B3A66",
      "900": "#042533",
      "df": "#0066cc" // Azul principal
    }
  },
});

const violetTheme = extendTheme({
  colors: {
    "b": {
      "green": "#7D3C98",  // Substituindo o azul claro pelo violeta
      "dark": "#1c1e21",
      "darklight": "#202c33",
      "darkgreen": "#9B59B6", // Substituindo o azul escuro pelo violeta escuro
      "lightgreen": "#C39BD3", // Substituindo o azul claro pelo violeta claro
      "blue": "#8E44AD",  // Substituindo o azul pelo violeta
    },
    "bl": {
      "gelosec": "#A569BD",  // Substituindo o tom gelosec por violeta claro
      "gelomd": "#dacfbd79",
      "gelo": "#f0f2f5",
      "painel": "#ffffff",
      "chat": "#dacfbdff",
      "painelI": "#ffffffbf",
      "green": "#D7BDE2" // Substituindo o azul claro pelo violeta claro
    },
    "painel": {
      "barraL": '#202C39',
      "barraD": '#202C39',
      "iconActiveL": "#A569BD",  // Violeta claro
      "iconActiveD": "#667781",
      "iconL": "#D7BDE2",  // Ícone em violeta claro
      "iconD": "#D7BDE2",
    },
    "primary": {
      50: "#f5e6ff",  // Tons de violeta claro
      100: "#e8ccff",
      200: "#d9b3ff",
      300: "#cc99ff",
      400: "#bf80ff",
      500: "#b266ff",  // Violeta principal
      600: "#9933ff",
      700: "#8000ff",
      800: "#6600cc",
      900: "#4d0099",
    },
    "bd": {
      "gelosec": "#8E44AD",  // Violeta claro
      "gelomd": "#111b21bf",
      "gelo": "#202C39",
      "painel": "#111b21",
      "chat": "#111b21",
      "painelI": "#0b141aed",
      "green": "#6C3483" // Substituindo o azul escuro por violeta escuro
    },
    "whatsapp": {
      "100": "#F5E6FF", // Tons de violeta claro
      "200": "#E8CCFF",
      "300": "#D9B3FF",
      "400": "#CC99FF",
      "500": "#BF80FF",  // Violeta principal
      "600": "#9933FF",
      "700": "#8000FF",
      "800": "#6600CC",
      "900": "#4D0099",
      "df": "#7D3C98"  // Violeta principal
    }
  },
});


const themeMap = new Map<string, any>();
themeMap.set("classic", classic);
themeMap.set("blue", blueTheme);
themeMap.set("violete", violetTheme);
themeMap.set("violet", violetTheme);


export function Providers({
  children, themeName
}: {
  children: React.ReactNode, themeName: string
}) {

  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])
  return (

    <Suspense fallback={<>Carregando...</>} >
      {isClient ?
        <div suppressHydrationWarning={true}>
          <CacheProvider>
            <StoreProvider>
              <ChakraProvider theme={themeMap.get(themeName ?? 'classic')} >
                <ColorModeScript initialColorMode={'system'} />
                {children}
              </ChakraProvider>
            </StoreProvider>
          </CacheProvider>
        </div> : <></>}
    </Suspense>
  )
}