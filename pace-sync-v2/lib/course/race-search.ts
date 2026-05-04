import type { CourseProfile, CourseProfilePoint } from '@/lib/types';

import { haversineMeters } from '@/lib/course/geo';

export type RaceCourseSearchResult =
  | { ok: true; profile: CourseProfile }
  | { ok: false; reason: 'not_found' | 'unavailable' };

type OsmElement = {
  type: string;
  id: number;
  members?: { type: string; ref: number; role?: string }[];
  tags?: Record<string, string>;
  geometry?: { lat: number; lon: number }[];
};

type NominatimHit = {
  boundingbox?: [string, string, string, string];
};

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';
const OPENTOPO_URL = 'https://api.opentopodata.org/v1/srtm90m';

const USER_AGENT =
  'Pacelist/0.1 (optional race search; contact via project maintainer)';

const tokenizeQuery = (query: string): string[] =>
  query
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 8);

const expandBbox = (
  south: number,
  north: number,
  west: number,
  east: number,
): [number, number, number, number] => {
  const latPad = Math.max((north - south) * 0.35, 0.02);
  const lonPad = Math.max((east - west) * 0.35, 0.02);
  return [south - latPad, west - lonPad, north + latPad, east + lonPad];
};

const simplifyCoords = (
  coords: { lat: number; lon: number }[],
  maxPoints: number,
): { lat: number; lon: number }[] => {
  if (coords.length <= maxPoints) {
    return coords;
  }
  const step = (coords.length - 1) / (maxPoints - 1);
  const out: { lat: number; lon: number }[] = [];
  for (let i = 0; i < maxPoints; i += 1) {
    out.push(coords[Math.round(i * step)]);
  }
  return out;
};

const dedupeConsecutive = (
  coords: { lat: number; lon: number }[],
): { lat: number; lon: number }[] => {
  const out: { lat: number; lon: number }[] = [];
  for (const c of coords) {
    const prev = out[out.length - 1];
    if (
      prev &&
      Math.abs(prev.lat - c.lat) < 1e-9 &&
      Math.abs(prev.lon - c.lon) < 1e-9
    ) {
      continue;
    }
    out.push(c);
  }
  return out;
};

const fetchElevations = async (
  coords: { lat: number; lon: number }[],
): Promise<number[] | null> => {
  const batchSize = 90;
  const elevations: number[] = [];

  for (let offset = 0; offset < coords.length; offset += batchSize) {
    const slice = coords.slice(offset, offset + batchSize);
    const locations = slice.map((c) => ({
      latitude: c.lat,
      longitude: c.lon,
    }));

    const res = await fetch(OPENTOPO_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({ locations }),
    });

    if (!res.ok) {
      return null;
    }

    const data = (await res.json()) as {
      results?: { elevation: number | null }[];
    };

    if (!data.results || data.results.length !== slice.length) {
      return null;
    }

    for (const row of data.results) {
      if (
        row.elevation === null ||
        row.elevation === undefined ||
        !Number.isFinite(row.elevation)
      ) {
        return null;
      }
      elevations.push(row.elevation);
    }
  }

  return elevations;
};

const pickRelationGeometry = (
  elements: OsmElement[],
  tokens: string[],
): { lat: number; lon: number }[] | null => {
  const ways = new Map<number, { lat: number; lon: number }[]>();

  for (const el of elements) {
    if (el.type === 'way' && el.geometry && el.geometry.length > 0) {
      ways.set(
        el.id,
        el.geometry.map((g) => ({ lat: g.lat, lon: g.lon })),
      );
    }
  }

  let best: { lat: number; lon: number }[] | null = null;

  for (const el of elements) {
    if (el.type !== 'relation' || !el.members?.length || !el.tags?.name) {
      continue;
    }

    const routeTag = el.tags.route;
    if (
      routeTag !== 'running' &&
      routeTag !== 'hiking' &&
      routeTag !== 'foot'
    ) {
      continue;
    }

    const nameLower = el.tags.name.toLowerCase();
    const matches = tokens.every((t) => nameLower.includes(t.toLowerCase()));
    if (!matches) {
      continue;
    }

    const coords: { lat: number; lon: number }[] = [];
    for (const m of el.members) {
      if (m.type !== 'way') {
        continue;
      }
      const geom = ways.get(m.ref);
      if (geom) {
        coords.push(...geom);
      }
    }

    const cleaned = dedupeConsecutive(coords);
    if (cleaned.length >= 2 && cleaned.length > (best?.length ?? 0)) {
      best = cleaned;
    }
  }

  return best;
};

const nominatimBBox = async (
  query: string,
): Promise<[number, number, number, number] | null> => {
  const url = `${NOMINATIM_URL}?${new URLSearchParams({
    q: query,
    format: 'json',
    limit: '1',
  }).toString()}`;

  const res = await fetch(url, {
    headers: { 'User-Agent': USER_AGENT },
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    return null;
  }

  const json = (await res.json()) as NominatimHit[];
  const hit = json[0];
  const bb = hit?.boundingbox;
  if (!bb || bb.length !== 4) {
    return null;
  }

  const south = Number(bb[0]);
  const north = Number(bb[1]);
  const west = Number(bb[2]);
  const east = Number(bb[3]);
  if (
    !Number.isFinite(south) ||
    !Number.isFinite(north) ||
    !Number.isFinite(west) ||
    !Number.isFinite(east)
  ) {
    return null;
  }

  return expandBbox(south, north, west, east);
};

const overpassRaceRoutes = async (
  south: number,
  west: number,
  north: number,
  east: number,
  pattern: string,
): Promise<OsmElement[] | null> => {
  const escaped = pattern.replace(/\\/g, '\\\\').replace(/"/g, '\\"');

  const ql = `
[out:json][timeout:25];
(
  relation["type"="route"]["route"="running"]["name"~"${escaped}",i](${south},${west},${north},${east});
  relation["type"="route"]["route"="hiking"]["name"~"${escaped}",i](${south},${west},${north},${east});
);
out geom;
`.trim();

  const res = await fetch(OVERPASS_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent': USER_AGENT,
      Accept: 'application/json',
    },
    body: new URLSearchParams({ data: ql }).toString(),
    signal: AbortSignal.timeout(25_000),
  });

  if (!res.ok) {
    return null;
  }

  const json = (await res.json()) as { elements?: OsmElement[] };
  return json.elements ?? [];
};

export const searchRaceCourseProfile = async (
  query: string,
): Promise<RaceCourseSearchResult> => {
  const trimmed = query.trim();
  const tokens = tokenizeQuery(trimmed);

  if (tokens.length === 0 || trimmed.length < 3) {
    return { ok: false, reason: 'not_found' };
  }

  const pattern = tokens.join('.*');

  try {
    const bbox = await nominatimBBox(trimmed);
    if (!bbox) {
      return { ok: false, reason: 'not_found' };
    }

    const [south, west, north, east] = bbox;
    const elements = await overpassRaceRoutes(south, west, north, east, pattern);
    if (!elements) {
      return { ok: false, reason: 'unavailable' };
    }

    const geometry = pickRelationGeometry(elements, tokens);
    if (!geometry) {
      return { ok: false, reason: 'not_found' };
    }

    const sampled = simplifyCoords(geometry, 96);
    const elevations = await fetchElevations(sampled);
    if (!elevations) {
      return { ok: false, reason: 'unavailable' };
    }

    const points: CourseProfilePoint[] = [];
    let cumulative = 0;
    for (let i = 0; i < sampled.length; i += 1) {
      if (i > 0) {
        cumulative += haversineMeters(sampled[i - 1], sampled[i]);
      }
      points.push({
        distanceMeters: cumulative,
        elevationMeters: elevations[i],
      });
    }

    const profile: CourseProfile = {
      points,
      totalDistanceMeters: cumulative,
      source: 'race_search',
      name: trimmed,
    };

    return { ok: true, profile };
  } catch {
    return { ok: false, reason: 'unavailable' };
  }
};
