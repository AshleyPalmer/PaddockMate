import { defineStore } from "pinia";
import { ref, shallowRef } from "vue";
import {
  db,
  type LayoutEntity,
  type PaddockMateDB,
  seedUkTracksIfEmpty,
  type TrackEntity,
} from "../db/paddockMateDb";
import { generateUuid } from "../utils/uuid";

export interface CreateCustomTrackInput {
  name: string;
  country?: string;
}

export interface CreateCustomLayoutInput {
  trackId: string;
  name: string;
  lengthMetres?: number;
}

export const useBaseTrackStore = defineStore("track", () => {
  const database = shallowRef<PaddockMateDB>(db);
  const tracks = ref<TrackEntity[]>([]);
  const layouts = ref<LayoutEntity[]>([]);

  function setDatabase(customDb: PaddockMateDB): void {
    database.value = customDb;
  }

  async function fetchTracks(): Promise<TrackEntity[]> {
    await seedUkTracksIfEmpty(database.value);
    const list = await database.value.tracks.orderBy("name").toArray();
    tracks.value = list;
    return list;
  }

  async function fetchLayouts(trackId?: string): Promise<LayoutEntity[]> {
    if (trackId) {
      const trackLayouts = await database.value.layouts.where("trackId").equals(trackId).toArray();
      // Merge into layouts list without duplicates
      for (const layout of trackLayouts) {
        const index = layouts.value.findIndex((l) => l.id === layout.id);
        if (index === -1) {
          layouts.value.push(layout);
        } else {
          layouts.value[index] = layout;
        }
      }
      return trackLayouts;
    }

    const allLayouts = await database.value.layouts.toArray();
    layouts.value = allLayouts;
    return allLayouts;
  }

  function getLayoutsForTrack(trackId: string): LayoutEntity[] {
    return layouts.value.filter((l) => l.trackId === trackId);
  }

  function getTrackById(id: string): TrackEntity | undefined {
    return tracks.value.find((t) => t.id === id);
  }

  function getLayoutById(id: string): LayoutEntity | undefined {
    return layouts.value.find((l) => l.id === id);
  }

  async function addTrack(input: CreateCustomTrackInput): Promise<TrackEntity> {
    const now = new Date().toISOString();
    const track: TrackEntity = {
      id: generateUuid(),
      name: input.name,
      country: input.country ?? "United Kingdom",
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };

    await database.value.tracks.add(track);
    tracks.value.push(track);
    return track;
  }

  async function addLayout(input: CreateCustomLayoutInput): Promise<LayoutEntity> {
    const now = new Date().toISOString();
    const layout: LayoutEntity = {
      id: generateUuid(),
      trackId: input.trackId,
      name: input.name,
      lengthMetres: input.lengthMetres,
      isCustom: true,
      createdAt: now,
      updatedAt: now,
    };

    await database.value.layouts.add(layout);
    layouts.value.push(layout);
    return layout;
  }

  return {
    tracks,
    layouts,
    setDatabase,
    fetchTracks,
    fetchLayouts,
    getLayoutsForTrack,
    getTrackById,
    getLayoutById,
    addTrack,
    addLayout,
  };
});

export function useTrackStore(customDb?: PaddockMateDB) {
  const store = useBaseTrackStore();
  if (customDb) {
    store.setDatabase(customDb);
  }
  return store;
}
