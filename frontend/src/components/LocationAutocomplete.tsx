import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';

interface LocationFields {
  address: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
}

interface NominatimResult {
  display_name: string;
  address: {
    house_number?: string;
    road?: string;
    city?: string;
    town?: string;
    village?: string;
    postcode?: string;
  };
  lat: string;
  lon: string;
}

interface LocationResult extends LocationFields {
  displayName: string;
}

interface LocationAutocompleteProps {
  onSelect: (loc: LocationFields) => void;
}

export function LocationAutocomplete({ onSelect }: Readonly<LocationAutocompleteProps>) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=fr`,
        { headers: { 'Accept-Language': 'fr' } },
      );
      const data = (await res.json()) as NominatimResult[];
      setResults(data.map((item) => {
        const addr = item.address;
        const streetParts = [addr.house_number, addr.road].filter(Boolean);
        return {
          displayName: item.display_name,
          address: streetParts.join(' ') || item.display_name.split(',')[0],
          city: addr.city ?? addr.town ?? addr.village ?? '',
          postalCode: addr.postcode ?? '',
          latitude: Number(item.lat),
          longitude: Number(item.lon),
        };
      }));
      setOpen(true);
    } catch {
      /* ignore network errors */
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (v: string) => {
    setQuery(v);
    setConfirmed(false);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => { void doSearch(v); }, 400);
  };

  const handleSelect = (result: LocationResult) => {
    setQuery(`${result.address}${result.city ? ', ' + result.city : ''}`);
    setOpen(false);
    setConfirmed(true);
    onSelect({
      address: result.address,
      city: result.city,
      postalCode: result.postalCode,
      latitude: result.latitude,
      longitude: result.longitude,
    });
  };

  return (
    <div ref={ref} className="relative">
      <div className="relative flex items-center">
        <Search className="absolute left-0 w-4 h-4 text-faint" strokeWidth={1.5} />
        <input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          className="input-field pl-6"
          placeholder="Rechercher une adresse…"
        />
        {loading && (
          <Loader2 className="absolute right-0 w-4 h-4 text-faint animate-spin" strokeWidth={1.5} />
        )}
        {confirmed && !loading && (
          <MapPin className="absolute right-0 w-4 h-4 text-emerald-600" strokeWidth={1.5} />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-surface border border-ink/12 shadow-[0_8px_24px_rgba(26,26,26,0.08)]">
          {results.map((result) => (
            <button
              key={result.displayName}
              type="button"
              onClick={() => handleSelect(result)}
              className="w-full text-left px-4 py-3 hover:bg-ink/[0.04] transition-colors duration-100 border-b border-ink/6 last:border-0"
            >
              <div className="flex items-start gap-2.5">
                <MapPin className="w-3.5 h-3.5 text-faint mt-0.5 shrink-0" strokeWidth={1.5} />
                <div>
                  <p className="font-sans text-sm text-ink">
                    {result.address}{result.city ? `, ${result.city}` : ''}
                  </p>
                  <p className="font-mono text-[10px] uppercase tracking-[0.08em] text-faint mt-0.5">
                    {[result.postalCode, result.city].filter(Boolean).join(' · ')}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
