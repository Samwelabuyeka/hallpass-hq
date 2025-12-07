
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import AdBanner from '@/components/AdBanner';
import { InFeedAd } from '@/components/ui/InFeedAd';
import { Tables } from '@/types/supabase';

type ListingWithProfile = Tables<'listings'> & { profiles: Pick<Tables<'profiles'>, 'full_name' | 'avatar_url'> | null };

const fetchListings = async (): Promise<ListingWithProfile[]> => {
  const { data, error } = await supabase
    .from('listings')
    .select(`
      id,
      title,
      price,
      media_url,
      profiles (full_name, avatar_url)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }
  return data || [];
};

export function Marketplace() {
  const { data: listings, isLoading, error } = useQuery<ListingWithProfile[], Error>({
    queryKey: ['listings'],
    queryFn: fetchListings,
  });

  return (
    <div className="p-4">
        <AdBanner />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Marketplace</h1>
        <Button asChild>
          <Link to="/marketplace/create">Create Listing</Link>
        </Button>
      </div>

      {isLoading && <div className="text-center">Loading listings...</div>}
      {error && <div className="text-center text-red-500">Error loading listings.</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {listings?.map((listing, index) => (
          <>
            <Card key={listing.id} className="overflow-hidden">
              <CardHeader className="p-0">
                <img src={listing.media_url} alt={listing.title} className="w-full h-48 object-cover" />
              </CardHeader>
              <CardContent className="p-4">
                <CardTitle className="text-lg font-semibold truncate">{listing.title}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {listing.profiles ? `by ${listing.profiles.full_name}` : 'by Anonymous'}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between items-center p-4 bg-muted/40">
                  <p className="font-bold text-lg">${(listing.price || 0).toFixed(2)}</p>
                  <Button variant="outline" size="sm">View</Button>
              </CardFooter>
            </Card>
            {(index + 1) % 8 === 0 && (
              <InFeedAd client="ca-pub-7929365740282293" slot="7056026184" layoutKey="-6t+ed+2i-1n-4w" />
            )}
          </>
        ))}
      </div>
    </div>
  );
}
