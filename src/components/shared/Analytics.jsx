import Script from 'next/script';

/**
 * Analytics — Google Analytics 4 and/or Google Tag Manager, loaded only when
 * the corresponding env var is set (so nothing loads in local/dev by default).
 *
 * Set in .env.local:
 *   NEXT_PUBLIC_GA_ID   = "G-XXXXXXX"   (GA4 Measurement ID)
 *   NEXT_PUBLIC_GTM_ID  = "GTM-XXXXXXX" (optional, Tag Manager)
 */
export default function Analytics() {
  const gaId = process.env.NEXT_PUBLIC_GA_ID;
  const gtmId = process.env.NEXT_PUBLIC_GTM_ID;

  if (!gaId && !gtmId) return null;

  return (
    <>
      {gtmId && (
        <Script id="gtm-init" strategy="afterInteractive">
          {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${gtmId}');`}
        </Script>
      )}

      {gaId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${gaId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${gaId}',{anonymize_ip:true});`}
          </Script>
        </>
      )}
    </>
  );
}
