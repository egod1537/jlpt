import type { AppDatabase } from "@back/lib/db/database";

export const PURGE_CONFIRMATION = "휴지통 완전 삭제";

/**
 * Permanently removes only records that are already in the trash. Review
 * events, review states, and word keys are deliberately retained so a book
 * cleanup cannot silently erase learning history shared by other books.
 */
export function purgeTrash(db: AppDatabase) {
  return db.transaction(() => {
    const timestamp = new Date().toISOString();
    const entryRows = db.prepare(`SELECT e.entry_id,e.revision
      FROM book_entries e
      LEFT JOIN books b ON b.id=e.book_id
      WHERE e.deleted_at IS NOT NULL OR b.deleted_at IS NOT NULL`).all() as Array<{ entry_id: string; revision: number }>;
    const bookCount = Number((db.prepare("SELECT COUNT(*) count FROM books WHERE deleted_at IS NOT NULL").get() as { count: number }).count);
    const folderCount = Number((db.prepare("SELECT COUNT(*) count FROM folders WHERE deleted_at IS NOT NULL").get() as { count: number }).count);

    for (const entry of entryRows) {
      db.prepare("INSERT INTO sync_changes(entity_type,entity_id,revision,action,payload_json,changed_at) VALUES ('entry',?,?,'delete','{}',?)")
        .run(entry.entry_id, entry.revision + 1, timestamp);
    }
    db.prepare(`DELETE FROM book_entries
      WHERE deleted_at IS NOT NULL OR book_id IN (SELECT id FROM books WHERE deleted_at IS NOT NULL)`).run();
    db.prepare("DELETE FROM books WHERE deleted_at IS NOT NULL").run();

    const activeBookReference = db.prepare("SELECT 1 FROM books b JOIN folders f ON f.id=b.folder_id WHERE b.deleted_at IS NULL AND f.deleted_at IS NOT NULL LIMIT 1").get();
    const activeFolderReference = db.prepare("SELECT 1 FROM folders c JOIN folders p ON p.id=c.parent_id WHERE c.deleted_at IS NULL AND p.deleted_at IS NOT NULL LIMIT 1").get();
    if (activeBookReference || activeFolderReference) throw new Error("활성 항목이 휴지통 폴더를 참조하고 있어 삭제할 수 없습니다.");

    // Break parent links inside the deleted subtree before removing it.
    db.prepare("UPDATE folders SET parent_id=NULL WHERE deleted_at IS NOT NULL").run();
    db.prepare("DELETE FROM folders WHERE deleted_at IS NOT NULL").run();
    return { folders: folderCount, books: bookCount, entries: entryRows.length, learningHistoryPreserved: true };
  })();
}
