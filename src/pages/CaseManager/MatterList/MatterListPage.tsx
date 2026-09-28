import React, { useState, useEffect, useCallback } from 'react';
import PageBreadcrumb from "@components/common/PageBreadCrumb";
import PageMeta from "@components/common/PageMeta";
import Button from "@components/ui/button/Button";
import { notifyMessage } from "@appAssets/utils/JToast.tsx";
import FilterMatter from "./FilterMatter";
//import { useNavigate } from 'react-router-dom';
import { Link, useNavigate } from "react-router";
import { useAppDispatch, useAppSelector } from "@appAssets/hooks/useAppDispatch";
import { fetchMatterAsync, resetCase, loadMatterForEditAsync } from "@appAssets/store/caseSlice";
import TanstackTableServer from "@components/tanstack-table-server/TanstackTableServer";
import { FilterValues } from "./FilterMatter";
import { useSidebar } from "@context/SidebarContext";

import { useModal } from "@appAssets/hooks/useModal";
import { Modal } from "@components/ui/modal";

import {
  createColumnHelper,
  SortingState,
} from '@tanstack/react-table';

import { FolderIcon, MoreDotIcon, PlusUserIcon, PlusIcon, PencilIcon, TrashBinIcon, ShootingStarIcon } from "@appAssets/icons";

export default function MatterListPage() {

  const { isExpanded } = useSidebar();
  const navigate = useNavigate();

  const dispatch = useAppDispatch()
  const { matterPageObj, loading } = useAppSelector((state) => state.case)
  const [queryState, setQueryState] = useState<{
    page: number;
    size: number;
    sorts: string[][];
  }>({
    page: 1,
    size: 10,
    sorts: [["MATTER_ID", "ASC"]],
  });
  const [filters, setFilters] = useState<FilterValues>({
    matterName: '',
    clientType: '',
  });

  const { isOpen, closeModal } = useModal();
  const deleteConfirmModal = useModal();
  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null);
  const [deleteVerifyCode, setDeleteVerifyCode] = useState<string>('');
  const [deleteVerifyInput, setDeleteVerifyInput] = useState<string>('');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedCellData, setSelectedCellData] = useState<any>(null);
  const [drawerActionType, setDrawerActionType] = useState<'create' | 'edit'>('create');
  const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeModal();
  };

  // Handle filter changes from FilterMatter component
  const handleApplyFilter = useCallback((filterValues: FilterValues) => {
    setFilters(filterValues);
    setQueryState((prev) => ({
      ...prev,
      page: 1,
    }));
  }, []);

  const toApiSorts = useCallback((sortState: SortingState): string[][] => {
    if (!sortState?.length) {
      return [["MATTER_ID", "ASC"]];
    }

    return sortState.map((sortBy) => [
      String(sortBy.id),
      sortBy.desc ? "DESC" : "ASC",
    ]);
  }, []);

  const handleSortDirection = useCallback((sortState: SortingState) => {
    setQueryState((prev) => ({
      ...prev,
      page: 1,
      sorts: toApiSorts(sortState),
    }));
  }, [toApiSorts]);

  const handleActivePageChange = useCallback((pageIndex: number) => {
    setQueryState((prev) => ({
      ...prev,
      page: pageIndex + 1,
    }));
  }, []);

  const handlePageSizeChange = useCallback((pageSize: number) => {
    setQueryState((prev) => ({
      ...prev,
      page: 1,
      size: pageSize,
    }));
  }, []);

  const columnHelper = createColumnHelper<any>();

  const columns = [
    columnHelper.accessor('id', {
      enableSorting: true,
      cell: (info) => info.getValue(),
      header: () => <span>#</span>,
      footer: (info) => info.column.id,
      meta: { maxWidth: '80px', minWidth: '60px' },
    }),
    columnHelper.accessor('matterName', {
      enableSorting: true,
      cell: (info) => info.getValue(),
      header: () => <span>Matter Name</span>,
      footer: (info) => info.column.id,
      meta: { maxWidth: '220px', minWidth: '140px' },
    }),
    columnHelper.accessor('clientType', {
      enableSorting: false,
      cell: (info) => info.getValue(),
      header: () => <span>Client Type</span>,
      footer: (info) => info.column.id,
      meta: { maxWidth: '140px', minWidth: '100px' },
    }),
    columnHelper.accessor('referredBy', {
      enableSorting: false,
      cell: (info) => info.getValue(),
      header: () => <span>Referred By</span>,
      footer: (info) => info.column.id,
      meta: { maxWidth: '160px', minWidth: '100px' },
    }),
    columnHelper.accessor('initialMatter', {
      enableSorting: false,
      cell: (info) => {
        const html = info.getValue();
        if (!html) return null;
        return <span dangerouslySetInnerHTML={{ __html: html }} />;
      },
      header: () => <span>Initial Matter</span>,
      footer: (info) => info.column.id,
      meta: { maxWidth: '260px', minWidth: '140px' },
    }),
    columnHelper.accessor('clientContact', {
      enableSorting: false,
      cell: (info) => {
        const contact = info.getValue();
        if (!contact) return <span className="text-gray-400">—</span>;
        return <span>{[contact.firstName, contact.lastName].filter(Boolean).join(' ')}</span>;
      },
      header: () => <span>Client Contact</span>,
      footer: (info) => info.column.id,
      meta: { maxWidth: '180px', minWidth: '120px' },
    }),
    columnHelper.display({
      id: "actions",
      header: () => <span>Actions</span>,
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
              onClick={() => handleEdit(row)}
            >
              <PencilIcon className="w-5 h-5" />
            </button>
            <div className="w-1" /> {/* Add space between edit and delete icon */}
            <button
              type="button"
              className="text-sm font-medium text-red-600 hover:text-red-700"
              onClick={() => handleDelete(row.id)}
            >
              <TrashBinIcon className="w-5 h-5" />
            </button>
          </div>
        );
      },
    }),
  ];



  const handleDelete = (itemId: number) => {
    setPendingDeleteId(itemId);
    setDeleteVerifyCode(String(Math.floor(100 + Math.random() * 900)));
    setDeleteVerifyInput('');
    deleteConfirmModal.openModal();
  };

  const confirmDelete = async () => {
    if (pendingDeleteId === null) return;
    if (deleteVerifyInput !== deleteVerifyCode) return;
    // Implement delete logic here, e.g., call an API to delete the item
    console.log("Deleting item with ID:", pendingDeleteId);
    // After deletion, you might want to refresh the data or show a notification
    notifyMessage("The matter has been successfully deleted", "SUCCESS");
    setPendingDeleteId(null);
    setDeleteVerifyCode('');
    setDeleteVerifyInput('');
    deleteConfirmModal.closeModal();
  };



  useEffect(() => {
    console.log("Fetching masters with queryState:", queryState, "and filters:", filters);
    dispatch(fetchMatterAsync({ queryState, filters }));
  }, [dispatch, queryState, filters]);

  const notify = (value: string) => {
    notifyMessage("The matter has been successfully updated", "SUCCESS");
    console.log("clicked on ", value);
    // newMatterDrawerOpen();
  };

  const tableContainerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    height: '100%',
    minHeight: 'calc(100vh - 180px)',
  };

  const handleCellDoubleClick = async (cellData: any) => {

    console.log("Double clicked cell data:", cellData);

    dispatch(resetCase());
    // await dispatch(loadMatterForEditAsync(cellData.row.id));
    await dispatch(loadMatterForEditAsync({ matterId: cellData.row.matterKey, editMode: true }));
    navigate(`/vd/matter/${cellData.row.matterKey}`);
  };

  const handleEdit = async (row: any) => {
    dispatch(resetCase());
    // await dispatch(loadMatterForEditAsync(row.id));
    await dispatch(loadMatterForEditAsync({ matterId: row.matterKey, editMode: true }));
    navigate(`/vd/matter/${row.matterKey}`);
  };

  function newMatterDrawerOpen(newMatterData: boolean, arg1: null) {
    navigate(`/vd/matter/new`);
  }

  return (
    <div>
      <PageMeta
        title="Matters"
        description="Matters page for managing matters, tags, and duplicates."
      />
      {/* <PageBreadcrumb pageTitle="Matters" /> */}

      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-4 ml-2 mr-1">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400">
            <FolderIcon className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">Matters</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage your cases, documents, and legal workflows</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button size="std" variant="primary" className="cust-button rounded-lg px-4 py-2.5"
            onClick={() => newMatterDrawerOpen(true, null)}
          >
            <PlusIcon />New Matter
          </Button>
          <button
            type="button"
            aria-label="More options"
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
          >
            <MoreDotIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* <div style={tableContainerStyle} className="border-radius_half border border-gray-200 bg-white px-2 py-1 dark:border-gray-800 dark:bg-white/[0.03]"> */}
      <div style={tableContainerStyle} className="border-radius_half border border-gray-200 bg-white px-2 py-1 dark:border-gray-800 dark:bg-gray-900">
        <TanstackTableServer
          hasFiltered={Boolean(filters.matterName || filters.clientType)}
          columnsDef={columns}
          pagedObj={matterPageObj}
          isSortable={true}
          isExpanded={isExpanded}
          isSelectAllOpt={true}
          onDoubleClickCell={handleCellDoubleClick}
          FilterComponent={<FilterMatter filterObj={filters} onApplyFilter={handleApplyFilter} />}
          callbackSortDirection={handleSortDirection}
          setActivePage={handleActivePageChange}
          onSelectPageSize={handlePageSizeChange}
          whenNoData={
            <>
              <p className="text-center fs-18 font-weight-bold mb-4">No matters found</p>
            </>
          }
          loading={loading}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmModal.isOpen}
        onClose={deleteConfirmModal.closeModal}
        className="max-w-[600px] p-5 lg:p-10"
        overlayClassName="bg-black/50"
        closeOnOutsideClick={false}
      >
        <div className="text-center">
          <div className="relative flex items-center justify-center z-1 mb-7">
            <svg
              className="fill-error-50 dark:fill-error-500/15"
              width="90"
              height="90"
              viewBox="0 0 90 90"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M34.364 6.85053C38.6205 -2.28351 51.3795 -2.28351 55.636 6.85053C58.0129 11.951 63.5594 14.6722 68.9556 13.3853C78.6192 11.0807 86.5743 21.2433 82.2185 30.3287C79.7862 35.402 81.1561 41.5165 85.5082 45.0122C93.3019 51.2725 90.4628 63.9451 80.7747 66.1403C75.3648 67.3661 71.5265 72.2695 71.5572 77.9156C71.6123 88.0265 60.1169 93.6664 52.3918 87.3184C48.0781 83.7737 41.9219 83.7737 37.6082 87.3184C29.8831 93.6664 18.3877 88.0266 18.4428 77.9156C18.4735 72.2695 14.6352 67.3661 9.22531 66.1403C-0.462787 63.9451 -3.30193 51.2725 4.49185 45.0122C8.84391 41.5165 10.2138 35.402 7.78151 30.3287C3.42572 21.2433 11.3808 11.0807 21.0444 13.3853C26.4406 14.6722 31.9871 11.951 34.364 6.85053Z"
                fill=""
                fillOpacity=""
              />
            </svg>
            <span className="absolute -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2">
              <svg
                className="fill-error-600 dark:fill-error-500"
                width="38"
                height="38"
                viewBox="0 0 38 38"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M9.62684 11.7496C9.04105 11.1638 9.04105 10.2141 9.62684 9.6283C10.2126 9.04252 11.1624 9.04252 11.7482 9.6283L18.9985 16.8786L26.2485 9.62851C26.8343 9.04273 27.7841 9.04273 28.3699 9.62851C28.9556 10.2143 28.9556 11.164 28.3699 11.7498L21.1198 18.9999L28.3699 26.25C28.9556 26.8358 28.9556 27.7855 28.3699 28.3713C27.7841 28.9571 26.8343 28.9571 26.2485 28.3713L18.9985 21.1212L11.7482 28.3715C11.1624 28.9573 10.2126 28.9573 9.62684 28.3715C9.04105 27.7857 9.04105 26.836 9.62684 26.2502L16.8771 18.9999L9.62684 11.7496Z"
                  fill=""
                />
              </svg>
            </span>
          </div>
          <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90 sm:text-title-sm">
            Delete Matter?
          </h4>
          <p className="text-sm leading-6 text-gray-500 dark:text-gray-400">
            Are you sure you want to delete this matter? This action cannot be undone.
          </p>
          <div className="mt-5">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Type the code below to confirm deletion:
            </p>
            <div className="inline-flex items-center justify-center px-5 py-2 mb-3 rounded-lg bg-error-50 dark:bg-error-500/10 border border-error-200 dark:border-error-500/30">
              <span className="text-2xl font-bold tracking-[0.4em] text-error-600 dark:text-error-400 select-none">
                {deleteVerifyCode}
              </span>
            </div>
            <input
              type="text"
              maxLength={3}
              value={deleteVerifyInput}
              onChange={(e) => setDeleteVerifyInput(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter code"
              className="w-full text-center text-lg font-semibold tracking-widest px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-800 dark:text-white/90 focus:outline-none focus:border-error-400 focus:ring-2 focus:ring-error-400/20"
            />
          </div>
          <div className="flex items-center justify-center w-full gap-3 mt-7">
            <button
              type="button"
              onClick={() => {
                setDeleteVerifyInput('');
                setDeleteVerifyCode('');
                deleteConfirmModal.closeModal();
              }}
              className="flex justify-center w-full px-4 py-3 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg shadow-theme-xs hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-700 sm:w-auto"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={deleteVerifyInput !== deleteVerifyCode}
              className="flex justify-center w-full px-4 py-3 text-sm font-medium text-white rounded-lg bg-error-500 shadow-theme-xs hover:bg-error-600 disabled:opacity-40 disabled:cursor-not-allowed sm:w-auto"
            >
              Yes, Delete
            </button>
          </div>
        </div>
      </Modal>

    </div>
  );
}

