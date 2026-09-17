import Script from "next/script";

export function ClarityAnalytics() {
  const clarityId = (
    process.env.NEXT_PUBLIC_CLARITY_ID || process.env.CLARITY_ID
  )?.trim();

  if (!clarityId) return null;

  return (
    <Script
      id="session-sync-loader"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{
        __html: `
          (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="/api/session-sync/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${clarityId}");
        `,
      }}
    />
  );
}
