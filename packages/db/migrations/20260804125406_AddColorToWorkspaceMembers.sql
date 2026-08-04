ALTER TABLE "workspace_members" ADD COLUMN "color" varchar(50);--> statement-breakpoint

-- Backfill default color for workspace members based on their id
UPDATE "workspace_members"
SET "color" = (
  CASE ((id % 8))
    WHEN 0 THEN '#0d9488' -- Teal
    WHEN 1 THEN '#65a30d' -- Green
    WHEN 2 THEN '#0284c7' -- Blue
    WHEN 3 THEN '#4f46e5' -- Purple
    WHEN 4 THEN '#ca8a04' -- Yellow
    WHEN 5 THEN '#ea580c' -- Orange
    WHEN 6 THEN '#dc2626' -- Red
    ELSE '#db2777'        -- Pink
  END
)
WHERE "color" IS NULL;--> statement-breakpoint

-- Update all card colors based on card creator's workspace member color identity
UPDATE "card"
SET "color" = wm."color"
FROM "list" l, "board" b, "workspace_members" wm
WHERE "card"."listId" = l."id"
  AND l."boardId" = b."id"
  AND wm."workspaceId" = b."workspaceId"
  AND wm."userId" = "card"."createdBy";