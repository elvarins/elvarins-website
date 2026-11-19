CREATE TABLE IF NOT EXISTS support_workflow (
  inquiry_id TEXT PRIMARY KEY REFERENCES inquiries(id) ON DELETE CASCADE,
  state TEXT NOT NULL CHECK(state IN ('open', 'resolved')),
  updated_at INTEGER NOT NULL
);
