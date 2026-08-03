import { format, isBefore, isSameYear, startOfDay } from "date-fns";
import { HiOutlinePaperClip } from "react-icons/hi";
import {
  HiBars3BottomLeft,
  HiChatBubbleLeft,
  HiOutlineClock,
} from "react-icons/hi2";
import { twMerge } from "tailwind-merge";

import Avatar from "~/components/Avatar";
import Badge from "~/components/Badge";
import CircularProgress from "~/components/CircularProgress";
import LabelIcon from "~/components/LabelIcon";
import { useLocalisation } from "~/hooks/useLocalisation";
import { getAvatarUrl } from "~/utils/helpers";

const Card = ({
  title,
  color,
  ticketNumber,
  labels,
  members,
  checklists,
  description,
  comments,
  attachments,
  dueDate,
}: {
  title: string;
  color?: string | null;
  ticketNumber?: string | null;
  labels: { name: string; colourCode: string | null }[];
  members: {
    publicId: string;
    email: string;
    user: { name: string | null; email: string; image: string | null } | null;
  }[];
  checklists: {
    publicId: string;
    name: string;
    items: {
      publicId: string;
      title: string;
      completed: boolean;
      index: number;
    }[];
  }[];
  description: string | null;
  comments: { publicId: string }[];
  attachments?: { publicId: string }[];
  dueDate?: Date | null;
}) => {
  const { dateLocale } = useLocalisation();
  const showYear = dueDate ? !isSameYear(dueDate, new Date()) : false;
  const isOverdue = dueDate ? isBefore(dueDate, startOfDay(new Date())) : false;
  const completedItems = checklists.reduce((acc, checklist) => {
    return acc + checklist.items.filter((item) => item.completed).length;
  }, 0);

  const totalItems = checklists.reduce((acc, checklist) => {
    return acc + checklist.items.length;
  }, 0);

  const progress =
    totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

  const hasDescription =
    description && description.replace(/<[^>]*>/g, "").trim().length > 0;
  const hasAttachments = attachments && attachments.length > 0;
  const hasDueDate = !!dueDate;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-light-200 bg-light-50 shadow-xs transition-all duration-150 hover:shadow-md dark:border-dark-300 dark:bg-dark-200 dark:text-dark-1000 dark:hover:bg-dark-300/80">
      {color && (
        <div
          className="h-1.5 w-full transition-colors"
          style={{ backgroundColor: color }}
        />
      )}
      <div className="flex flex-col px-3 py-2.5 text-sm text-neutral-900 dark:text-dark-1000">
        {ticketNumber && (
          <span className="mb-1 text-xs font-mono font-medium text-light-700 dark:text-dark-800">
            {ticketNumber}
          </span>
        )}
        <span className="break-words font-medium leading-snug">{title}</span>
        {labels.length ||
        members.length ||
        checklists.length > 0 ||
        hasDescription ||
        comments.length > 0 ||
        hasDueDate ||
        hasAttachments ? (
          <div className="mt-2 flex flex-col justify-end">
            <div className="space-x-0.5">
              {labels.map((label) => (
                <Badge
                  key={label.name}
                  value={label.name}
                  iconLeft={<LabelIcon colourCode={label.colourCode} />}
                />
              ))}
            </div>
            <div className="mt-2 flex items-center justify-between gap-1">
              <div className="flex items-center gap-2">
                {hasDescription && (
                  <div className="flex items-center gap-1 text-light-700 dark:text-dark-800">
                    <HiBars3BottomLeft className="h-4 w-4" />
                  </div>
                )}
                {hasDueDate && dueDate && (
                  <div
                    className={twMerge(
                      "flex items-center gap-1",
                      isOverdue
                        ? "text-red-600 dark:text-red-400"
                        : "text-light-800 dark:text-dark-800",
                    )}
                  >
                    <HiOutlineClock className="h-4 w-4" />
                    <span className="text-[11px]">
                      {format(dueDate, showYear ? "do MMM yyyy" : "do MMM", {
                        locale: dateLocale,
                      })}
                    </span>
                  </div>
                )}
                {comments.length > 0 && (
                  <div className="flex items-center gap-1 text-light-700 dark:text-dark-800">
                    <HiChatBubbleLeft className="h-4 w-4" />
                  </div>
                )}
                {hasAttachments && (
                  <div className="flex items-center gap-1 text-light-700 dark:text-dark-800">
                    <HiOutlinePaperClip className="h-4 w-4" />
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end gap-1">
                {checklists.length > 0 && (
                  <div className="flex items-center gap-1 rounded-full border-[1px] border-light-300 px-2 py-1 dark:border-dark-600">
                    <CircularProgress
                      progress={progress || 2}
                      size="sm"
                      className="flex-shrink-0"
                    />
                    <span className="text-[10px] text-light-900 dark:text-dark-950">
                      {completedItems}/{totalItems}
                    </span>
                  </div>
                )}
                {members.length > 0 && (
                  <div className="isolate flex justify-end -space-x-1 overflow-hidden">
                    {members.map(({ user, email }) => {
                      const avatarUrl = user?.image
                        ? getAvatarUrl(user.image)
                        : undefined;

                      return (
                        <Avatar
                          key={user?.name ?? email}
                          name={user?.name ?? ""}
                          email={user?.email ?? email}
                          imageUrl={avatarUrl}
                          size="sm"
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default Card;
