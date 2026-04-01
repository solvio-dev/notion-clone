import { useState, useEffect, useCallback } from "react";
import {
  getChildPages,
  getFavoritePages,
  createPage,
  updatePage,
  deletePage,
} from "../services/database";
import type { Page } from "../types";

export function usePages() {
  const [pages, setPages] = useState<Page[]>([]);
  const [favorites, setFavorites] = useState<Page[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [rootPages, favPages] = await Promise.all([
      getChildPages(null),
      getFavoritePages(),
    ]);
    setPages(rootPages);
    setFavorites(favPages);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addPage = useCallback(
    async (parentId: string | null = null) => {
      const id = crypto.randomUUID();
      const position = pages.length;
      await createPage({ id, title: "", parent_id: parentId, position });
      await refresh();
      return id;
    },
    [pages.length, refresh],
  );

  const removePage = useCallback(
    async (id: string) => {
      await deletePage(id);
      await refresh();
    },
    [refresh],
  );

  const editPage = useCallback(
    async (id: string, updates: Parameters<typeof updatePage>[1]) => {
      await updatePage(id, updates);
      await refresh();
    },
    [refresh],
  );

  return { pages, favorites, loading, refresh, addPage, removePage, editPage };
}
