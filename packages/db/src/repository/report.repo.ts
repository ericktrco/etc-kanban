import { and, between, eq, isNull, sql } from "drizzle-orm";

import type { dbClient } from "@kan/db/client";
import {
  boards,
  cardActivities,
  cards,
  lists,
} from "@kan/db/schema";

/**
 * Fetch cards that had activity on a given date, grouped by board.
 * Each card appears only once even if it had multiple activities that day.
 */
export const getCardsByActivityDate = async (
  db: dbClient,
  args: {
    workspaceId: number;
    startDate: Date;
    endDate: Date;
    boardIds?: number[];
    listIds?: number[];
  },
) => {
  const results = await db
    .selectDistinctOn([cards.id], {
      cardTitle: cards.title,
      cardDescription: cards.description,
      cardPublicId: cards.publicId,
      boardName: boards.name,
      boardPublicId: boards.publicId,
      listName: lists.name,
      listPublicId: lists.publicId,
    })
    .from(cardActivities)
    .innerJoin(cards, eq(cardActivities.cardId, cards.id))
    .innerJoin(lists, eq(cards.listId, lists.id))
    .innerJoin(boards, eq(lists.boardId, boards.id))
    .where(
      and(
        eq(boards.workspaceId, args.workspaceId),
        between(cardActivities.createdAt, args.startDate, args.endDate),
        isNull(cards.deletedAt),
        isNull(lists.deletedAt),
        isNull(boards.deletedAt),
        args.boardIds?.length
          ? sql`${boards.id} IN (${sql.join(
              args.boardIds.map((id) => sql`${id}`),
              sql`, `,
            )})`
          : undefined,
        args.listIds?.length
          ? sql`${lists.id} IN (${sql.join(
              args.listIds.map((id) => sql`${id}`),
              sql`, `,
            )})`
          : undefined,
      ),
    );

  // Group results by board
  const boardMap = new Map<
    string,
    {
      name: string;
      publicId: string;
      cards: { title: string; description?: string | null; publicId: string }[];
    }
  >();

  for (const row of results) {
    const existing = boardMap.get(row.boardPublicId);
    if (existing) {
      existing.cards.push({
        title: row.cardTitle,
        description: row.cardDescription ?? null,
        publicId: row.cardPublicId,
      });
    } else {
      boardMap.set(row.boardPublicId, {
        name: row.boardName,
        publicId: row.boardPublicId,
        cards: [
          {
            title: row.cardTitle,
            description: row.cardDescription ?? null,
            publicId: row.cardPublicId,
          },
        ],
      });
    }
  }

  return Array.from(boardMap.values());
};

/**
 * Get all boards for a workspace (for the board filter dropdown).
 */
export const getWorkspaceBoards = async (
  db: dbClient,
  workspaceId: number,
) => {
  return db
    .select({
      id: boards.id,
      publicId: boards.publicId,
      name: boards.name,
    })
    .from(boards)
    .where(
      and(
        eq(boards.workspaceId, workspaceId),
        isNull(boards.deletedAt),
        eq(boards.isArchived, false),
      ),
    );
};

/**
 * Get all lists for a workspace (for the list/column filter dropdown).
 */
export const getWorkspaceLists = async (
  db: dbClient,
  workspaceId: number,
) => {
  return db
    .select({
      id: lists.id,
      publicId: lists.publicId,
      name: lists.name,
      boardName: boards.name,
    })
    .from(lists)
    .innerJoin(boards, eq(lists.boardId, boards.id))
    .where(
      and(
        eq(boards.workspaceId, workspaceId),
        isNull(lists.deletedAt),
        isNull(boards.deletedAt),
        eq(boards.isArchived, false),
      ),
    );
};
