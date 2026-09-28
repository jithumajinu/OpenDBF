import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { ApiService } from '@apiServices/ApiService'
import { createApiPageRequest } from '@apiServices/common/domain/PageUtil'

export interface DocketDto {
  id: number
  matterId: number
  matterName: string
  matterKey: string
  caseId: number | null
  caseName: string | null
  docketNumber: string
  courtName: string
  bench: string
  stage: string
  status: string
  bookmark: boolean
  openedDate: string | null
  nextHearingDate: string | null
  closedDate: string | null
  notes: string | null
}

export interface DocketPageResponse {
  pageSize: number
  pageNumber: number
  totalPages: number
  previous: boolean
  next: boolean
  totalCount: number
  content: DocketDto[]
  paginationContent: null
  pagingArea: boolean
  hasData: boolean
}

interface DocketState {
  docketPageObj: DocketPageResponse
  loading: boolean
  error: string | null
}

const initialState: DocketState = {
  docketPageObj: {
    pageSize: 10,
    pageNumber: 1,
    totalPages: 0,
    previous: false,
    next: false,
    totalCount: 0,
    content: [],
    paginationContent: null,
    pagingArea: false,
    hasData: false,
  },
  loading: false,
  error: null,
}

const restApi: ApiService = ApiService.getInstance()

type FetchDocketsParams = {
  queryState?: {
    page?: number
    size?: number
    sorts?: string[][]
  }
  filters?: {
    keyword?: string
    status?: string
  }
}

export const toggleBookmarkAsync = createAsyncThunk(
  'docket/toggleBookmark',
  async ({ docketId, bookmark }: { docketId: number; bookmark: boolean }) => {
    await restApi.docketService.updateBookmark(docketId, bookmark)
    return { docketId, bookmark }
  }
)

export const fetchDocketsAsync = createAsyncThunk(
  'docket/fetchDockets',
  async (params?: FetchDocketsParams) => {
    const p = params || {}
    const qs = {
      page: p.queryState?.page || 1,
      size: p.queryState?.size || 10,
      sorts: p.queryState?.sorts || [['DOCKET_ID', 'DESC']],
      keyword: p.filters?.keyword || '',
      status: p.filters?.status ?? 'open',
    }
    const response = await restApi.docketService.findPage(createApiPageRequest(qs))
    return response?.data?.data || []
  }
)

const docketSlice = createSlice({
  name: 'docket',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null
    },
    // optimistic toggle so the star flips instantly
    toggleBookmarkOptimistic: (state, action: { payload: { docketId: number; bookmark: boolean } }) => {
      const item = state.docketPageObj.content.find((d) => d.id === action.payload.docketId)
      if (item) item.bookmark = action.payload.bookmark
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDocketsAsync.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchDocketsAsync.fulfilled, (state, action) => {
        state.loading = false
        state.docketPageObj = action.payload
      })
      .addCase(fetchDocketsAsync.rejected, (state, action) => {
        state.loading = false
        state.error = action.error.message || 'Failed to fetch dockets'
      })
  },
})

export const { clearError, toggleBookmarkOptimistic } = docketSlice.actions
export default docketSlice.reducer
