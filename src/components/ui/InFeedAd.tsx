import { useEffect } from 'react';

declare global {
    interface Window {
        adsbygoogle: any;
    }
}

interface InFeedAdProps {
    client: string;
    slot: string;
    layoutKey?: string;
}

export function InFeedAd({ client, slot, layoutKey }: InFeedAdProps) {
    useEffect(() => {
        try {
            (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (e) {
            console.error("Ad push error", e);
        }
    }, []);

    return (
        <ins className="adsbygoogle"
             style={{ display: 'block' }}
             data-ad-format="fluid"
             data-ad-layout-key={layoutKey}
             data-ad-client={client}
             data-ad-slot={slot}></ins>
    );
}