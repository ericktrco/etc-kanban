import type { ReactNode } from "react";
import { t } from "@lingui/core/macro";
import { useState } from "react";
import { Draggable } from "react-beautiful-dnd";
import { useForm } from "react-hook-form";
import {
  HiEllipsisHorizontal,
  HiOutlinePaintBrush,
  HiOutlinePlusSmall,
  HiOutlineSquaresPlus,
  HiOutlineTrash,
} from "react-icons/hi2";

import { authClient } from "@kan/auth/client";
import { colours } from "@kan/shared/constants";

import ColorPicker from "~/components/ColorPicker";
import Dropdown from "~/components/Dropdown";
import { Tooltip } from "~/components/Tooltip";
import { usePermissions } from "~/hooks/usePermissions";
import { useModal } from "~/providers/modal";
import { api } from "~/utils/api";

interface ListProps {
  children: ReactNode;
  index: number;
  list: List;
  setSelectedPublicListId: (publicListId: PublicListId) => void;
}

interface List {
  publicId: string;
  name: string;
  color?: string | null;
  createdBy?: string | null;
  cards?: unknown[];
}

interface FormValues {
  listPublicId: string;
  name: string;
}

type PublicListId = string;

export default function List({
  children,
  index,
  list,
  setSelectedPublicListId,
}: ListProps) {
  const { openModal } = useModal();
  const { canCreateCard, canEditList, canDeleteList } = usePermissions();
  const { data: session } = authClient.useSession();
  const isCreator = list.createdBy && session?.user.id === list.createdBy;
  const canEdit = canEditList || isCreator;
  const canDrag = canEditList || isCreator;
  const [showColorPicker, setShowColorPicker] = useState(false);

  const openNewCardForm = (publicListId: PublicListId) => {
    if (!canCreateCard) return;
    openModal("NEW_CARD");
    setSelectedPublicListId(publicListId);
  };

  const utils = api.useUtils();
  const updateList = api.list.update.useMutation({
    onSuccess: () => {
      utils.board.byId.invalidate();
    },
  });

  const { register, handleSubmit } = useForm<FormValues>({
    defaultValues: {
      listPublicId: list.publicId,
      name: list.name,
    },
    values: {
      listPublicId: list.publicId,
      name: list.name,
    },
  });

  const onSubmit = (values: FormValues) => {
    if (!canEdit) return;
    if (values.name === list.name) return;
    updateList.mutate({
      listPublicId: values.listPublicId,
      name: values.name,
    });
  };

  const handleColorChange = (newColor: string | null) => {
    if (!canEdit) return;
    updateList.mutate({
      listPublicId: list.publicId,
      color: newColor,
    });
    setShowColorPicker(false);
  };

  const handleOpenDeleteListConfirmation = () => {
    setSelectedPublicListId(list.publicId);
    openModal("DELETE_LIST");
  };

  const activeColor = list.color;

  return (
    <Draggable
      key={list.publicId}
      draggableId={list.publicId}
      index={index}
      isDragDisabled={!canDrag}
    >
      {(provided, snapshot) => (
        <div
          key={list.publicId}
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`relative mr-5 flex h-fit min-w-[18rem] max-w-[18rem] snap-start flex-col rounded-xl border border-light-400/80 bg-light-300/90 shadow-sm transition-all duration-200 dark:border-dark-300/80 dark:bg-dark-100/95 dark:text-dark-1000 md:snap-align-none ${
            snapshot.isDragging ? "shadow-xl ring-2 ring-indigo-500/50" : ""
          }`}
        >
          {/* Accent Header Bar */}
          <div
            className="h-1.5 w-full rounded-t-xl transition-colors duration-200"
            style={{
              backgroundColor: activeColor ?? "transparent",
              backgroundImage: !activeColor
                ? "linear-gradient(to right, rgba(99, 102, 241, 0.4), rgba(168, 85, 247, 0.4))"
                : undefined,
            }}
          />

          <div className="p-2">
            <div className="mb-2 flex items-center justify-between gap-1.5 px-1 pt-1">
              <div className="flex flex-1 items-center gap-1.5 overflow-hidden">
                {activeColor && (
                  <span
                    className="h-2.5 w-2.5 flex-shrink-0 rounded-full shadow-sm"
                    style={{ backgroundColor: activeColor }}
                  />
                )}
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="flex-1 focus-visible:outline-none"
                >
                  <input
                    id="name"
                    type="text"
                    {...register("name")}
                    onBlur={handleSubmit(onSubmit)}
                    readOnly={!canEdit}
                    className="w-full border-0 bg-transparent p-0 text-sm font-semibold tracking-tight text-neutral-900 focus:ring-0 focus-visible:outline-none dark:text-dark-1000"
                  />
                </form>
              </div>

              <div className="flex items-center gap-0.5">
                {canEdit && (
                  <Tooltip content={t`Column color`}>
                    <button
                      type="button"
                      className="inline-flex items-center rounded-md p-1 text-dark-50 hover:bg-light-400 dark:hover:bg-dark-200"
                      onClick={() => setShowColorPicker(!showColorPicker)}
                    >
                      <HiOutlinePaintBrush className="h-4 w-4 text-dark-900" />
                    </button>
                  </Tooltip>
                )}

                <Tooltip
                  content={
                    !canCreateCard ? t`You don't have permission` : undefined
                  }
                >
                  <button
                    className="inline-flex items-center rounded-md p-1 text-dark-50 hover:bg-light-400 disabled:cursor-not-allowed disabled:opacity-60 dark:hover:bg-dark-200"
                    onClick={() => openNewCardForm(list.publicId)}
                    disabled={!canCreateCard}
                  >
                    <HiOutlinePlusSmall
                      className="h-4 w-4 text-dark-900"
                      aria-hidden="true"
                    />
                  </button>
                </Tooltip>

                {(() => {
                  const dropdownItems = [
                    ...(canCreateCard
                      ? [
                          {
                            label: t`Add a card`,
                            action: () => openNewCardForm(list.publicId),
                            icon: (
                              <HiOutlineSquaresPlus className="h-[18px] w-[18px] text-dark-900" />
                            ),
                          },
                        ]
                      : []),
                    ...(canEdit
                      ? [
                          {
                            label: t`Change column color`,
                            action: () => setShowColorPicker(!showColorPicker),
                            icon: (
                              <HiOutlinePaintBrush className="h-[18px] w-[18px] text-dark-900" />
                            ),
                          },
                        ]
                      : []),
                    ...(canDeleteList || isCreator
                      ? [
                          {
                            label: t`Delete list`,
                            action: handleOpenDeleteListConfirmation,
                            icon: (
                              <HiOutlineTrash className="h-[18px] w-[18px] text-dark-900" />
                            ),
                          },
                        ]
                      : []),
                  ];

                  if (dropdownItems.length === 0) {
                    return null;
                  }

                  return (
                    <div className="relative inline-block">
                      <Dropdown items={dropdownItems}>
                        <HiEllipsisHorizontal className="h-4 w-4 text-dark-900" />
                      </Dropdown>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Quick Color Picker Popover */}
            {showColorPicker && (
              <div className="mb-3 rounded-lg border border-light-400 bg-light-50 p-2.5 shadow-md dark:border-dark-300 dark:bg-dark-200">
                <ColorPicker
                  selectedColor={activeColor}
                  onChange={handleColorChange}
                  label={t`Column Accent Color`}
                />
              </div>
            )}

            {children}
          </div>
        </div>
      )}
    </Draggable>
  );
}
