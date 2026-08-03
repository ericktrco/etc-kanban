import { TRPCError } from "@trpc/server";
import { z } from "zod";

import * as reportRepo from "@kan/db/repository/report.repo";
import * as workspaceRepo from "@kan/db/repository/workspace.repo";

import { createTRPCRouter, protectedProcedure } from "../trpc";
import { assertPermission } from "../utils/permissions";

export const reportRouter = createTRPCRouter({
  generateReport: protectedProcedure
    .meta({
      openapi: {
        summary: "Generate a daily work report",
        method: "GET",
        path: "/reports/daily",
        description:
          "Generates a daily work report showing cards with activity on the given date, grouped by board",
        tags: ["Reports"],
        protect: true,
      },
    })
    .input(
      z.object({
        workspacePublicId: z.string().min(12),
        date: z.string().datetime(),
        boardPublicIds: z.array(z.string().min(12)).optional(),
        listPublicIds: z.array(z.string().min(12)).optional(),
      }),
    )
    .output(
      z.object({
        boards: z.array(
          z.object({
            name: z.string(),
            publicId: z.string(),
            cards: z.array(
              z.object({
                title: z.string(),
                description: z.string().nullable().optional(),
                publicId: z.string(),
              }),
            ),
          }),
        ),
      }),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const workspace = await workspaceRepo.getByPublicId(
        ctx.db,
        input.workspacePublicId,
      );

      if (!workspace)
        throw new TRPCError({
          message: `Workspace with public ID ${input.workspacePublicId} not found`,
          code: "NOT_FOUND",
        });

      await assertPermission(ctx.db, userId, workspace.id, "board:view");

      // Parse the date and compute start/end of day
      const reportDate = new Date(input.date);
      const startDate = new Date(reportDate);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(reportDate);
      endDate.setHours(23, 59, 59, 999);

      // Resolve board internal IDs from publicIds if provided
      let boardIds: number[] | undefined;
      if (input.boardPublicIds?.length) {
        const allBoards = await reportRepo.getWorkspaceBoards(
          ctx.db,
          workspace.id,
        );
        boardIds = allBoards
          .filter((b) => input.boardPublicIds!.includes(b.publicId))
          .map((b) => b.id);
      }

      // Resolve list internal IDs from publicIds if provided
      let listIds: number[] | undefined;
      if (input.listPublicIds?.length) {
        const allLists = await reportRepo.getWorkspaceLists(
          ctx.db,
          workspace.id,
        );
        listIds = allLists
          .filter((l) => input.listPublicIds!.includes(l.publicId))
          .map((l) => l.id);
      }

      const boards = await reportRepo.getCardsByActivityDate(ctx.db, {
        workspaceId: workspace.id,
        startDate,
        endDate,
        boardIds,
        listIds,
      });

      return { boards };
    }),

  getBoards: protectedProcedure
    .meta({
      openapi: {
        summary: "Get workspace boards for report filtering",
        method: "GET",
        path: "/reports/boards",
        description:
          "Retrieves all active boards in a workspace for use in report board filter",
        tags: ["Reports"],
        protect: true,
      },
    })
    .input(
      z.object({
        workspacePublicId: z.string().min(12),
      }),
    )
    .output(
      z.array(
        z.object({
          publicId: z.string(),
          name: z.string(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const workspace = await workspaceRepo.getByPublicId(
        ctx.db,
        input.workspacePublicId,
      );

      if (!workspace)
        throw new TRPCError({
          message: `Workspace with public ID ${input.workspacePublicId} not found`,
          code: "NOT_FOUND",
        });

      await assertPermission(ctx.db, userId, workspace.id, "board:view");

      const boards = await reportRepo.getWorkspaceBoards(
        ctx.db,
        workspace.id,
      );

      return boards.map((b) => ({ publicId: b.publicId, name: b.name }));
    }),

  getLists: protectedProcedure
    .meta({
      openapi: {
        summary: "Get workspace lists for report column filtering",
        method: "GET",
        path: "/reports/lists",
        description:
          "Retrieves all active lists/columns in a workspace for report list filter",
        tags: ["Reports"],
        protect: true,
      },
    })
    .input(
      z.object({
        workspacePublicId: z.string().min(12),
      }),
    )
    .output(
      z.array(
        z.object({
          publicId: z.string(),
          name: z.string(),
          boardName: z.string(),
        }),
      ),
    )
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;

      if (!userId)
        throw new TRPCError({
          message: `User not authenticated`,
          code: "UNAUTHORIZED",
        });

      const workspace = await workspaceRepo.getByPublicId(
        ctx.db,
        input.workspacePublicId,
      );

      if (!workspace)
        throw new TRPCError({
          message: `Workspace with public ID ${input.workspacePublicId} not found`,
          code: "NOT_FOUND",
        });

      await assertPermission(ctx.db, userId, workspace.id, "board:view");

      const lists = await reportRepo.getWorkspaceLists(
        ctx.db,
        workspace.id,
      );

      return lists.map((l) => ({
        publicId: l.publicId,
        name: l.name,
        boardName: l.boardName,
      }));
    }),
});
