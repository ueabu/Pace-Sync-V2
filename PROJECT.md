# Pacelist

A web app that maps a Spotify playlist to a runner's race pace, so the right songs play at the right moments.

## Who it's for

Runners who care about which song is playing when. The kind of people who think about what they want to hear in the final mile of a race, or what should carry them through a tough climb at the halfway point.

## Core user flow

1. User lands on the homepage and connects their Spotify account
2. User picks a playlist to import
3. User enters race distance and target time inline at the top of the editor
4. User lands on the timeline canvas where each song is a block sized by its duration, laid out across the race
5. User drags and drops to reorder, and pins specific songs to specific moments to anchor them in place
6. User searches Spotify and adds tracks if they think of something they want to include
7. Optionally, user uploads a GPX file of the course to see elevation alongside the timeline
8. When the arrangement is right, user syncs back to Spotify either as a new playlist with a name they choose, or as a replacement for the playlist they imported from
9. User can come back later to adjust the plan as their training and goal time evolve

## In scope for v1

- Spotify connect, playlist import, search, and sync (create new or replace existing)
- Race details: distance and target time
- Timeline editor with drag and drop, anchor pins, and a visual readout of when each song hits which point in the run
- Optional GPX upload with elevation chart aligned to the timeline
- Optional race search as a bonus path for course information
- Mobile responsive across every surface
- Persistence so users can come back and adjust their plans

## Out of scope for v1

- BPM or cadence matching
- Live in-run playback control or race day mode
- Social features, sharing, or public plans
- Training plan integration
- Multiple races saved per user beyond basic persistence
- Native mobile apps

## Technical stack

- Next.js with the App Router and TypeScript
- Tailwind CSS for styling, mobile responsive throughout
- Supabase for Postgres and auth
- Spotify Web API with Authorization Code plus PKCE for OAuth
- GPX parsing for elevation when a course file is provided

## Domain glossary

- **Track**: a song from Spotify with an id, name, artists, and duration in milliseconds
- **Anchor**: a track pinned to a specific moment in the race, expressed as seconds from the start
- **Race plan**: distance, target time, anchors, and the ordered list of tracks
- **Arrangement**: the computed result of applying the race plan to a set of tracks, producing each track's start time within the race
- **Timeline**: the visual canvas where tracks are laid out across the duration of the race
- **Sync**: the action of writing the final arrangement back to Spotify, either as a new playlist or by replacing the tracks in an existing one