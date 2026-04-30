import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { AppError } from '../../utils/AppError';

const querySchema = z.object({ q: z.string().min(3) });

export async function geocodeSearchHandler(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { q } = querySchema.parse(req.query);
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&limit=5&countrycodes=fr`;
    const upstream = await fetch(url, {
      headers: {
        'Accept-Language': 'fr',
        'User-Agent': 'Sportify Pro / geocoding-proxy (cardosobenjamin01@gmail.com)',
      },
    });
    if (!upstream.ok) {
      throw new AppError(502, 'GEOCODING_UNAVAILABLE', 'Geocoding service unavailable');
    }
    const data: unknown = await upstream.json();
    res.json({ data });
  } catch (err) {
    next(err);
  }
}
