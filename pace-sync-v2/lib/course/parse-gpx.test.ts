import { describe, expect, test } from 'bun:test';

import { parseGpx } from '@/lib/course/parse-gpx';

describe('parseGpx', () => {
  test('builds cumulative distance and elevations', () => {
    const xml = `<?xml version="1.0"?>
<gpx version="1.1">
  <trk><name>T</name><trkseg>
    <trkpt lat="0" lon="0"><ele>10</ele></trkpt>
    <trkpt lat="0" lon="0.001"><ele>25</ele></trkpt>
    <trkpt lat="0.001" lon="0.001"><ele>18</ele></trkpt>
  </trkseg></trk>
</gpx>`;

    const result = parseGpx(xml, { name: 'sample.gpx' });
    expect(result.ok).toBe(true);
    if (!result.ok) {
      return;
    }

    expect(result.profile.source).toBe('gpx');
    expect(result.profile.name).toBe('sample.gpx');
    expect(result.profile.points).toHaveLength(3);
    expect(result.profile.points[0].distanceMeters).toBe(0);
    expect(result.profile.points[0].elevationMeters).toBe(10);
    expect(result.profile.points[1].elevationMeters).toBe(25);
    expect(result.profile.totalDistanceMeters).toBeGreaterThan(0);
    expect(result.profile.points[2].distanceMeters).toBe(
      result.profile.totalDistanceMeters,
    );
  });

  test('rejects when elevations missing', () => {
    const xml = `<gpx><trk><trkseg>
      <trkpt lat="1" lon="2"></trkpt>
      <trkpt lat="1" lon="2.01"></trkpt>
    </trkseg></trk></gpx>`;
    const result = parseGpx(xml);
    expect(result.ok).toBe(false);
  });
});
