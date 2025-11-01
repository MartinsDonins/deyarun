import Document, { Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  render() {
    const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
    const sanitizedMeasurementId = (measurementId ?? '').replace(/['"\\]/g, '');

    return (
      <Html lang="lv">
        <Head>
          {/* Performance optimizations */}
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="https://www.googletagmanager.com" />

          {/* Google Analytics - Secure Implementation */}
          {measurementId && (
            <>
              <script
                async
                src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
              />
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.dataLayer = window.dataLayer || [];
                    function gtag(){dataLayer.push(arguments);}
                    gtag('js', new Date());
                    gtag('config', '${sanitizedMeasurementId}', {
                      page_title: document.title,
                      page_location: window.location.href,
                    });
                  `,
                }}
              />
            </>
          )}

          {/* Meta tags */}
          <meta name="description" content="DeyaRun - Jūsu personīgais skrējiena treneris un treniņu plānotājs. Personalizēti treniņu plāni, GPS izsekošana un progresa analīze." />
          <meta name="keywords" content="skrējiens, treniņš, maratons, fitness, DeyaRun, GPS, treniņu plāns, progresa analīze" />
          <meta name="author" content="DeyaRun" />
          <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover, user-scalable=no" />
          <meta name="theme-color" content="#FF6B47" />
          <meta name="msapplication-TileColor" content="#FF6B47" />
          <meta name="format-detection" content="telephone=no" />
          <meta name="mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-capable" content="yes" />
          <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
          <meta name="apple-mobile-web-app-title" content="DeyaRun" />

          {/* Open Graph / Facebook */}
          <meta property="og:type" content="website" />
          <meta property="og:title" content="DeyaRun - Personīgais skrējiena treneris" />
          <meta property="og:description" content="Sasniedz savus skriešanas mērķus ar personalizētiem treniņu plāniem un profesionālu analīzi." />
          <meta property="og:image" content="/og-image.png" />

          {/* Twitter */}
          <meta property="twitter:card" content="summary_large_image" />
          <meta property="twitter:title" content="DeyaRun - Personīgais skrējiena treneris" />
          <meta property="twitter:description" content="Sasniedz savus skriešanas mērķus ar personalizētiem treniņu plāniem un profesionālu analīzi." />
          <meta property="twitter:image" content="/og-image.png" />

          {/* Favicon */}
          <link rel="icon" href="/favicon.ico" />
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
          <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
          <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
          <link rel="manifest" href="/site.webmanifest" crossOrigin="use-credentials" />

          {/* PWA Compatibility - Enhanced for mobile */}
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
