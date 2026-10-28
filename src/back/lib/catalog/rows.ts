type JsonValue = null | boolean | number | string | JsonValue[] | { [key: string]: JsonValue };

export function parseJson<T extends JsonValue>(value: string): T {
  return JSON.parse(value) as T;
}

export function folderFromRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name),
    parentId: row.parent_id === null ? null : String(row.parent_id),
    pinned: Boolean(row.pinned),
    orderIndex: Number(row.order_index),
    revision: Number(row.revision),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: row.deleted_at === null ? null : String(row.deleted_at),
    ...(row.book_count !== undefined ? { bookCount: Number(row.book_count) } : {}),
    ...(row.child_count !== undefined ? { childCount: Number(row.child_count) } : {}),
  };
}

export function bookFromRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    title: String(row.title),
    category: row.category === null ? null : String(row.category),
    folderId: row.folder_id === null ? null : String(row.folder_id),
    favorite: Boolean(row.favorite),
    orderIndex: Number(row.order_index),
    origin: String(row.origin),
    originRef: row.origin_ref === null ? null : parseJson(row.origin_ref as string),
    revision: Number(row.revision),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: row.deleted_at === null ? null : String(row.deleted_at),
    ...(row.entry_count !== undefined ? { entryCount: Number(row.entry_count) } : {}),
    ...(row.studied_count !== undefined ? { studiedCount: Number(row.studied_count) } : {}),
    ...(row.last_studied_at !== undefined ? { lastStudiedAt: row.last_studied_at === null ? null : String(row.last_studied_at) } : {}),
  };
}

export function entryFromRow(row: Record<string, unknown>) {
  return {
    entryId: String(row.entry_id),
    bookId: String(row.book_id),
    wordId: String(row.word_id),
    position: Number(row.position),
    term: String(row.term),
    reading: row.reading === null ? null : String(row.reading),
    meanings: parseJson(row.meanings_json as string),
    primaryMeaning: row.primary_meaning === null ? null : String(row.primary_meaning),
    nuance: row.nuance === null ? null : String(row.nuance),
    partOfSpeech: parseJson(row.part_of_speech_json as string),
    jlptLevels: parseJson(row.jlpt_levels_json as string),
    years: parseJson(row.years_json as string),
    categories: parseJson(row.categories_json as string),
    relatedTerms: parseJson(row.related_terms_json as string),
    examples: parseJson(row.examples_json as string),
    sources: parseJson(row.sources_json as string),
    status: String(row.status),
    tags: parseJson(row.tags_json as string),
    revision: Number(row.revision),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
    deletedAt: row.deleted_at === null ? null : String(row.deleted_at),
  };
}

export function studySessionFromRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    bookIds: parseJson<string[]>(String(row.book_ids_json)),
    mode: String(row.mode),
    includeReview: Boolean(row.include_review),
    wordIds: parseJson<string[]>(String(row.word_ids_json)),
    position: Number(row.position),
    revealed: Boolean(row.revealed),
    ratings: parseJson<Record<string, string>>(String(row.ratings_json)),
    queue: parseJson<string[]>(String(row.queue_json || "[]")),
    loopMode: Boolean(row.loop_mode),
    results: parseJson<Array<{ wordId: string; rating: string; occurredAt: string }>>(String(row.results_json || "[]")),
    status: String(row.status),
    revision: Number(row.revision),
    updatedAt: String(row.updated_at),
    createdAt: String(row.created_at),
    deletedAt: row.deleted_at === null ? null : String(row.deleted_at),
  };
}

export function bookmarkFromRow(row: Record<string, unknown>) {
  return {
    entryId: String(row.entry_id),
    revision: Number(row.revision),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}
