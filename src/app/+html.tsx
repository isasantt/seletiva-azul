import { ScrollViewStyleReset } from 'expo-router/html';
import { type PropsWithChildren } from 'react';

/**
 * HTML raiz do app no web.
 *
 * Este arquivo roda apenas no build (Node.js), por isso não usa APIs do
 * navegador. Ele define metadados globais, fonte e o esquema de cores inicial.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="pt-BR">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        <meta name="application-name" content="AtmosBag" />
        <meta name="apple-mobile-web-app-title" content="AtmosBag" />
        <meta name="theme-color" content="#002060" />
        <meta name="msapplication-TileColor" content="#002060" />
        <meta name="color-scheme" content="light dark" />
        <meta
          name="description"
          content="AtmosBag: acompanhe sua bagagem em tempo real, do check-in à esteira. Rastreio por etiqueta IATA, alertas e RIB/ANAC em um só lugar."
        />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AtmosBag" />
        <meta property="og:title" content="AtmosBag | Azul" />
        <meta
          property="og:description"
          content="Sua bagagem, em cada etapa do voo. Rastreio em tempo real, alertas e suporte para passageiros e operações."
        />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="AtmosBag | Azul" />
        <meta
          name="twitter:description"
          content="Sua bagagem, em cada etapa do voo. Rastreio em tempo real, alertas e suporte para passageiros e operações."
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />

        {/* Evita o flash de fundo claro antes da hidratação do tema. */}
        <style
          dangerouslySetInnerHTML={{
            __html:
              'html,body,#root{background-color:#F2F7FC}@media (prefers-color-scheme:dark){html,body,#root{background-color:#061426}}',
          }}
        />

        {/*
          Deixa o ScrollView principal com comportamento de tela cheia,
          mantendo a rolagem interna do React Native Web.
        */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
