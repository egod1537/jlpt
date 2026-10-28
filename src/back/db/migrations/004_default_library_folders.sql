INSERT INTO folders(id,name,name_normalized,parent_id,order_index,revision,created_at,updated_at,deleted_at,pinned) VALUES
  ('folder-listening','청해','청해',NULL,0,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL,0),
  ('folder-real-hankkeut','진짜 한끝','진짜 한끝',NULL,1,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL,0),
  ('folder-reading','독해','독해',NULL,2,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL,0),
  ('folder-language-knowledge','언지','언지',NULL,3,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL,0),
  ('folder-editorial','사설','사설',NULL,4,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL,0),
  ('folder-hankkeut','한끝','한끝',NULL,5,1,strftime('%Y-%m-%dT%H:%M:%fZ','now'),strftime('%Y-%m-%dT%H:%M:%fZ','now'),NULL,0);

UPDATE books SET folder_id='folder-real-hankkeut', order_index=CASE id
  WHEN 'session-045' THEN 0 WHEN 'session-040' THEN 1 WHEN 'session-035' THEN 2 WHEN 'session-034' THEN 3
  WHEN 'session-031' THEN 4 WHEN 'session-030' THEN 5 WHEN 'session-029' THEN 6 WHEN 'session-028' THEN 7
  WHEN 'html-n1-yuui-79-84' THEN 8 WHEN 'session-038' THEN 9 WHEN 'session-041' THEN 10 WHEN 'session-044' THEN 11 END,
  revision=revision+1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id IN ('session-045','session-040','session-035','session-034','session-031','session-030','session-029','session-028','html-n1-yuui-79-84','session-038','session-041','session-044');

UPDATE books SET folder_id='folder-reading', order_index=CASE id
  WHEN 'session-027' THEN 0 WHEN 'session-017' THEN 1 WHEN 'session-022' THEN 2 WHEN 'session-010' THEN 3 END,
  revision=revision+1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id IN ('session-027','session-017','session-022','session-010');

UPDATE books SET folder_id='folder-language-knowledge', order_index=CASE id
  WHEN 'session-020' THEN 0 WHEN 'session-018' THEN 1 WHEN 'session-016' THEN 2 END,
  revision=revision+1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id IN ('session-020','session-018','session-016');

UPDATE books SET folder_id='folder-editorial', order_index=CASE id
  WHEN 'session-032' THEN 0 WHEN 'session-026' THEN 1 WHEN 'session-019' THEN 2
  WHEN 'session-014' THEN 3 WHEN 'session-008' THEN 4 WHEN 'session-024' THEN 5 END,
  revision=revision+1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id IN ('session-032','session-026','session-019','session-014','session-008','session-024');

UPDATE books SET folder_id='folder-hankkeut', order_index=CASE id
  WHEN 'session-025' THEN 0 WHEN 'session-015' THEN 1 WHEN 'session-013' THEN 2 END,
  revision=revision+1, updated_at=strftime('%Y-%m-%dT%H:%M:%fZ','now')
WHERE id IN ('session-025','session-015','session-013');

