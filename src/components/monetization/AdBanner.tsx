
import { useEffect } from 'react';

export const AdBanner = () => {
  useEffect(() => {
    // Load the AdSense script
    const script = document.createElement('script');
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js";
    script.async = true;
    script.crossOrigin = "anonymous";
    // You will need to replace this with your own AdSense client ID
    script.setAttribute('data-ad-client', 'ca-pub-YOUR_ADSENSE_CLIENT_ID');
    document.head.appendChild(script);

    // Push the ad request
    try {
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (e) {
      console.error('AdSense error:', e);
    }

    return () => {
      // Optional: Cleanup script on component unmount
      document.head.removeChild(script);
    };
  }, []);

  return (
    <div className="my-4 p-4 border rounded-lg bg-muted/20 text-center">
      <ins className="adsbygoogle"
           style={{ display: 'block' }}
           data-ad-client="ca-pub-YOUR_ADSENSE_CLIENT_ID" // Replace with your client ID
           data-ad-slot="YOUR_ADSENSE_SLOT_ID" // Replace with your ad slot ID
           data-ad-format="auto"
           data-full-width-responsive="true"></ins>
      <p className="text-xs text-muted-foreground mt-2">Advertisement</p>
    </div>
  );
};
