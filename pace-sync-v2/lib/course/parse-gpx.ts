import type { CourseProfile, CourseProfilePoint } from '@/lib/types';

import { haversineMeters } from '@/lib/course/geo';

export type ParseGpxResult =
  | { ok: true; profile: CourseProfile }
  | { ok: false; error: string };

type RawPt = { lat: number; lon: number; ele: number };

const parseCoordAttr = (attrs: string, key: string): number | null => {
  const re = new RegExp(`${key}="([^"]+)"`, 'i');
  const m = re.exec(attrs);
  if (!m?.[1]) {
    return null;
  }
  const v = Number.parseFloat(m[1]);
  return Number.isFinite(v) ? v : null;
};

const extractEle = (body: string): number | null => {
  const eleMatch = /<ele[^>]*>([\d.-]+)<\/ele>/i.exec(body);
  if (!eleMatch?.[1]) {
    return null;
  }
  const v = Number.parseFloat(eleMatch[1]);
  return Number.isFinite(v) ? v : null;
};

export const parseGpx = (xml: string, options?: { name?: string }): ParseGpxResult => {
  const trimmed = xml.trim();
  if (!trimmed.toLowerCase().includes('<gpx')) {
    return { ok: false, error: 'File does not look like GPX (missing gpx root).' };
  }

  const chunks = trimmed.split(/<trkpt\s/i).slice(1);
  const raw: RawPt[] = [];

  for (const chunk of chunks) {
    const gt = chunk.indexOf('>');
    if (gt === -1) {
      continue;
    }
    const attrPart = chunk.slice(0, gt);
    const lat = parseCoordAttr(attrPart, 'lat');
    const lon = parseCoordAttr(attrPart, 'lon');
    if (lat === null || lon === null) {
      continue;
    }
    const body = chunk.slice(gt + 1);
    const boundary = body.search(/<\s*trkpt\b/i);
    const segment = boundary === -1 ? body : body.slice(0, boundary);
    const ele = extractEle(segment);
    if (ele === null) {
      continue;
    }
    raw.push({ lat, lon, ele });
  }

  if (raw.length < 2) {
    return {
      ok: false,
      error:
        'Need at least two track points with latitude, longitude, and elevation.',
    };
  }

  const points: CourseProfilePoint[] = [];
  let cumulative = 0;
  for (let i = 0; i < raw.length; i += 1) {
    if (i > 0) {
      cumulative += haversineMeters(
        { lat: raw[i - 1].lat, lon: raw[i - 1].lon },
        { lat: raw[i].lat, lon: raw[i].lon },
      );
    }
    points.push({
      distanceMeters: cumulative,
      elevationMeters: raw[i].ele,
    });
  }

  const profile: CourseProfile = {
    points,
    totalDistanceMeters: cumulative,
    source: 'gpx',
    name: options?.name,
  };

  return { ok: true, profile };
};
