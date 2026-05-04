"use client";

import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils/cn";

export type SyncPlaylistModalProps = {
  /** Spotify playlist the user imported from (used for replace target). */
  importedPlaylistId: string;
  importedPlaylistName: string;
  trackUris: string[];
  trigger: React.ReactNode;
};

export function SyncPlaylistModal({
  importedPlaylistId,
  importedPlaylistName,
  trackUris,
  trigger,
}: SyncPlaylistModalProps) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "replace">("replace");
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(false);

  const count = trackUris.length;

  const preview =
    mode === "create"
      ? newName.trim().length > 0
        ? `Create a new playlist named “${newName.trim()}” with ${count} track${count === 1 ? "" : "s"}.`
        : `Create a new playlist with ${count} track${count === 1 ? "" : "s"}. Name it below.`
      : `This will replace ${count} track${count === 1 ? "" : "s"} in “${importedPlaylistName}” with your new arrangement.`;

  async function handleConfirm() {
    if (mode === "create" && newName.trim().length === 0) {
      toast.error("Name your playlist before syncing.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/sync-playlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          name: mode === "create" ? newName.trim() : undefined,
          playlistId: mode === "replace" ? importedPlaylistId : undefined,
          trackUris,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        error?: string;
        spotifyUrl?: string;
      };
      if (!res.ok) {
        toast.error(data.error ?? "Could not sync with Spotify.");
        return;
      }
      if (!data.spotifyUrl) {
        toast.error("Unexpected response from server.");
        return;
      }
      toast.success("Synced to Spotify", {
        description: (
          <a
            href={data.spotifyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-accent underline-offset-2 hover:underline"
          >
            Open playlist in Spotify
          </a>
        ),
        duration: 8000,
      });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sync to Spotify</DialogTitle>
          <DialogDescription>
            Push your current track order to Spotify as a new playlist or overwrite the
            one you imported.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-foreground">
              How should we sync?
            </legend>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-left transition-colors",
                mode === "replace"
                  ? "border-accent bg-accent/5"
                  : "border-stone-200 hover:border-stone-300",
              )}
            >
              <input
                type="radio"
                name="sync-mode"
                className="mt-1 accent-accent"
                checked={mode === "replace"}
                onChange={() => setMode("replace")}
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Replace imported playlist
                </span>
                <span className="text-sm text-stone-600">
                  Overwrite “{importedPlaylistName}” with this order.
                </span>
              </span>
            </label>
            <label
              className={cn(
                "flex cursor-pointer items-start gap-3 rounded-md border p-3 text-left transition-colors",
                mode === "create"
                  ? "border-accent bg-accent/5"
                  : "border-stone-200 hover:border-stone-300",
              )}
            >
              <input
                type="radio"
                name="sync-mode"
                className="mt-1 accent-accent"
                checked={mode === "create"}
                onChange={() => setMode("create")}
              />
              <span>
                <span className="block text-sm font-medium text-foreground">
                  Create a new playlist
                </span>
                <span className="text-sm text-stone-600">
                  Keep the source list as-is and publish a fresh playlist.
                </span>
              </span>
            </label>
          </fieldset>

          {mode === "create" ? (
            <div className="grid gap-2">
              <Label htmlFor="new-playlist-name">New playlist name</Label>
              <Input
                id="new-playlist-name"
                placeholder="e.g. Marathon morning — 3:45 goal"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoComplete="off"
              />
            </div>
          ) : null}

          <p className="rounded-md border border-dashed border-stone-200 bg-stone-50 px-3 py-2 text-sm leading-relaxed text-stone-800">
            {preview}
          </p>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={loading || count === 0}>
            {loading ? "Syncing…" : "Confirm sync"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
