"use client";

import { useRef, useState } from "react";
import type { DraftItem } from "@/lib/actions/reviews";
import { addReviewItem, deleteReviewItem, updateReviewItem } from "@/lib/actions/items";
import { isDrinkDirty, itemChangeAllowed, validateDraftItem } from "@/lib/item-rules";

/** One drink (or food) row in the edit form. */
export interface DrinkRow {
  /** Stable React key; the item id once saved. */
  key: string;
  /** The saved item's id, or null until the row is first saved. */
  id: string | null;
  values: DraftItem;
  /** What the server last stored, or null for a row that isn't saved yet. */
  saved: DraftItem | null;
  saving: boolean;
  error: string | null;
}

export type SavedItem = DraftItem & { id: string };

const emptyItem = (): DraftItem => ({
  name: "",
  category: "drink",
  type: null,
  rating: null,
  is_favorite: false,
  notes: null,
});

const messageOf = (e: unknown) => (e instanceof Error ? e.message : String(e));

export const rowIsDirty = (row: DrinkRow) => row.saving || isDrinkDirty(row.values, row.saved);

/**
 * The drink rows of the edit form. Each row saves itself (on a score or toggle tap, and when
 * a text field loses focus), one request at a time per row, so the rows are never left with
 * unsaved changes for long. `flush` saves whatever is left and waits, for Save and Publish.
 *
 * `getStatus` reads the review's current status, so a score can't be cleared on a published
 * review: the row snaps back to its saved score and says why.
 */
export function useDrinkRows(reviewId: string, getStatus: () => "draft" | "published", initial: SavedItem[]) {
  const [rows, setRows] = useState<DrinkRow[]>(() =>
    initial.map(({ id, ...values }) => ({ key: id, id, values, saved: values, saving: false, error: null })),
  );
  // The latest rows, for saves that run after an await. Updated with every change.
  const rowsRef = useRef(rows);
  // One promise chain per row, so a row's saves never overlap or land out of order.
  const chains = useRef(new Map<string, Promise<void>>());

  function commit(next: (rows: DrinkRow[]) => DrinkRow[]) {
    rowsRef.current = next(rowsRef.current);
    setRows(rowsRef.current);
  }

  function patch(key: string, changes: Partial<DrinkRow>) {
    commit((all) => all.map((row) => (row.key === key ? { ...row, ...changes } : row)));
  }

  const find = (key: string) => rowsRef.current.find((row) => row.key === key);

  function enqueue(key: string, task: () => Promise<void>): Promise<void> {
    const next = (chains.current.get(key) ?? Promise.resolve())
      .then(task)
      .catch((e: unknown) => patch(key, { saving: false, error: messageOf(e) }));
    chains.current.set(key, next);
    return next;
  }

  async function saveNow(key: string) {
    const row = find(key);
    if (!row) return;
    if (!isDrinkDirty(row.values, row.saved)) {
      if (row.error) patch(key, { error: null });
      return;
    }
    const first = validateDraftItem(row.values);
    if (!first.ok) {
      patch(key, { error: first.reason });
      return;
    }

    let values = row.values;
    let notice: string | null = null;
    const allowed = itemChangeAllowed(getStatus(), first.item.rating);
    if (!allowed.ok) {
      // Put the saved score back, so the screen shows what the published review has.
      notice = allowed.reason;
      values = { ...values, rating: row.saved?.rating ?? null };
      patch(key, { values, error: notice });
      if (!row.saved || !isDrinkDirty(values, row.saved)) return;
    }
    const check = validateDraftItem(values);
    if (!check.ok) return;

    patch(key, { saving: true, error: notice });
    if (row.id) {
      const result = await updateReviewItem(row.id, check.item);
      if (result.error) return patch(key, { saving: false, error: result.error });
      patch(key, { saving: false, saved: check.item, error: notice });
    } else {
      const result = await addReviewItem(reviewId, check.item);
      if (result.error || !result.itemId) return patch(key, { saving: false, error: result.error ?? "Couldn't save." });
      patch(key, { saving: false, id: result.itemId, saved: check.item, error: notice });
    }
  }

  /** Save a row if it has changes. Safe to call often; saves queue per row. */
  const save = (key: string) => enqueue(key, () => saveNow(key));

  /** Change a row's values (no save; call `save` when the edit is done). */
  const change = (key: string, values: Partial<DraftItem>) => {
    const row = find(key);
    if (row) patch(key, { values: { ...row.values, ...values } });
  };

  const add = () =>
    commit((all) => [
      ...all,
      { key: crypto.randomUUID(), id: null, values: emptyItem(), saved: null, saving: false, error: null },
    ]);

  /** Delete a row (and its item, once any save in flight lands). Returns whether it's gone. */
  async function remove(key: string): Promise<boolean> {
    await (chains.current.get(key) ?? Promise.resolve());
    const row = find(key);
    if (!row) return true;
    if (row.id) {
      patch(key, { saving: true, error: null });
      try {
        const result = await deleteReviewItem(row.id);
        if (result.error) {
          patch(key, { saving: false, error: result.error });
          return false;
        }
      } catch (e) {
        patch(key, { saving: false, error: messageOf(e) });
        return false;
      }
    }
    chains.current.delete(key);
    commit((all) => all.filter((r) => r.key !== key));
    return true;
  }

  /**
   * Save every row with changes and wait for all saves in flight. Returns the names of rows
   * still unsaved afterwards (an error, or an invalid value); empty when everything is saved.
   */
  async function flush(): Promise<string[]> {
    for (const row of rowsRef.current) void save(row.key);
    await Promise.all([...chains.current.values()]);
    return rowsRef.current
      .filter((row) => isDrinkDirty(row.values, row.saved))
      .map((row) => row.values.name.trim() || "a drink with no name");
  }

  return { rows, add, change, save, remove, flush };
}
