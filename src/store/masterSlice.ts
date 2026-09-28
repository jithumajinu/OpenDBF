import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { ApiService } from '@apiServices/ApiService'
import { createApiPageRequest } from '@apiServices/common/domain/PageUtil'
import type { MasterItem, MasterKey } from '@pages/Master/masterConfig'

export interface MasterPageResponse {
    pageSize: number
    pageNumber: number
    totalPages: number
    previous: boolean
    next: boolean
    totalCount: number
    content: MasterItem[]
    paginationContent: null
    pagingArea: boolean
    hasData: boolean
}

export interface MasterQueryState {
    page: number
    size: number
    sorts: string[][]
}

export interface UpsertMasterItem {
    code: string
    name: string
    sortOrder: number
    isActive: boolean
    description?: string
}

interface MasterState {
    masterPageObj: MasterPageResponse
    loading: boolean
    error: string | null
}

const emptyMasterPageResponse = (): MasterPageResponse => ({
    pageSize: 10,
    pageNumber: 1,
    totalPages: 0,
    previous: false,
    next: false,
    totalCount: 0,
    content: [],
    paginationContent: null,
    pagingArea: false,
    hasData: false
})

const initialState: MasterState = {
    masterPageObj: emptyMasterPageResponse(),
    loading: false,
    error: null
}

const restApi: ApiService = ApiService.getInstance()

const defaultQueryState: MasterQueryState = {
    page: 1,
    size: 10,
    sorts: [['CODE', 'ASC']]
}

type FilterParams = {
    keyword?: string
    masterKey: MasterKey
}

type FetchMastersParams = {
    queryState?: Partial<MasterQueryState>
    filters?: FilterParams
}

type MasterMutationParams = {
    masterKey: MasterKey
    itemId?: number
    payload: UpsertMasterItem
}

type DeleteMasterParams = {
    masterKey: MasterKey
    itemId: number
}


const masterDataMapping = (_masterKey: string, response: any): MasterPageResponse => {
    const data = response?.data?.data
    if (!data) {
        return emptyMasterPageResponse()
    }

    const rawContent: any[] = data.content || []

    const mappedContent: MasterItem[] = rawContent.map((item: any) => {
        const keys = Object.keys(item)
        // Detect dynamic field names: e.g. priorityId, priorityCode, priorityName
        const idKey = keys.find((k) => k !== 'tenantId' && k.endsWith('Id')) || 'id'
        const codeKey = keys.find((k) => k.endsWith('Code')) || 'code'
        const nameKey = keys.find((k) => k.endsWith('Name')) || 'name'

        return {
            id: item[idKey],
            code: item[codeKey],
            name: item[nameKey],
            sortOrder: item.sortOrder ?? 0,
            isActive: item.isActive ?? true,
            description: item.description
        }
    })

    return {
        pageSize: data.pageSize,
        pageNumber: data.pageNumber,
        totalPages: data.totalPages,
        previous: data.previous,
        next: data.next,
        totalCount: data.totalCount,
        content: mappedContent,
        paginationContent: null,
        pagingArea: false,
        hasData: (data.totalCount ?? 0) > 0
    }
}

export const fetchMastersAsync = createAsyncThunk(
    'master/fetchMasters',
    async (params?: FetchMastersParams) => {
        const masterKey = params?.filters?.masterKey
        if (!masterKey) {
            return emptyMasterPageResponse()
        }

        const qs = {
            page: params?.queryState?.page || defaultQueryState.page,
            size: params?.queryState?.size || defaultQueryState.size,
            sorts: params?.queryState?.sorts || defaultQueryState.sorts,
            keyword: params?.filters?.keyword || ''
        }

        const response = await restApi.masterService.findPage(createApiPageRequest(qs), masterKey)

        return masterDataMapping(masterKey, response)
    }
)


const createMasterDataMapping = (_masterKey: string, payload: any): any => {
    let maprequestbody;
    if (_masterKey === "court") {
        maprequestbody = {
            courtCode: payload.code,
            courtName: payload.name,
            courtLevel: payload.name,
            city: payload.name,
            state: payload.name,
            country: payload.name,
            sortOrder: payload.sortOrder,
            active: true
        }
    }
    else if (_masterKey === "case-type") {
        maprequestbody = {
            caseTypeCode: payload.code,
            caseTypeName: payload.name,
            sortOrder: payload.sortOrder,
            active: true,
            description: payload.description
        }
    }
    else if (_masterKey === "case-status") {
        maprequestbody = {
            statusCode: payload.code,
            statusName: payload.name,
            sortOrder: payload.sortOrder,
            terminal: true,
            description: payload.description
        }
    }
    else if (_masterKey === "priority") {
        maprequestbody = {
            priorityCode: payload.code,
            priorityName: payload.name,
            sortOrder: payload.sortOrder,
            active: true,
            description: payload.description
        }
    }
    else if (_masterKey === "party-type") {
        maprequestbody = {
            partyTypeCode: payload.code,
            partyTypeName: payload.name,
            sortOrder: payload.sortOrder,
            active: true,
            description: payload.description
        }
    }
    else if (_masterKey === "document-type") {
        maprequestbody = {
            docTypeCode: payload.code,
            docTypeName: payload.name,
            sortOrder: payload.sortOrder,
            active: true,
            description: payload.description
        }
    }
    else if (_masterKey === "hearing-outcome") {
        maprequestbody = {
            outcomeCode: payload.code,
            outcomeName: payload.name,
            sortOrder: payload.sortOrder,
            active: true,
            description: payload.description
        }
    }
    else {
        maprequestbody = {
            code: payload.code,
            name: payload.name,
            sortOrder: payload.sortOrder,
            isActive: payload.isActive,
            description: payload.description
        }
    }

    return maprequestbody;

}


const updateMasterDataMapping = (_masterKey: string, payload: any, itemId: any): any => {
    let maprequestbody;
    if (_masterKey === "court") {
        maprequestbody = {
            courtCode: payload.code,
            courtName: payload.name,
            courtLevel: payload.name,
            city: payload.name,
            state: payload.name,
            country: payload.name,
            sortOrder: payload.sortOrder,
            active: true
        }
    }
    else if (_masterKey === "case-type") {
        maprequestbody = {
            caseTypeCode: payload.code,
            caseTypeName: payload.name,
            sortOrder: payload.sortOrder,
            active: true,
            description: payload.description
        }
    }
    else if (_masterKey === "case-status") {
        maprequestbody = {
            statusCode: payload.code,
            statusName: payload.name,
            sortOrder: payload.sortOrder,
            terminal: true,
            description: payload.description
        }
    }
    else if (_masterKey === "priority") {
        maprequestbody = {
            priorityCode: payload.code,
            priorityName: payload.name,
            sortOrder: payload.sortOrder,
            active: true,
            description: payload.description
        }
    }
    else if (_masterKey === "party-type") {
        maprequestbody = {
            partyTypeCode: payload.code,
            partyTypeName: payload.name,
            sortOrder: payload.sortOrder,
            active: true,
            description: payload.description
        }
    }
    else if (_masterKey === "document-type") {
        maprequestbody = {
            docTypeCode: payload.code,
            docTypeName: payload.name,
            sortOrder: payload.sortOrder,
            active: true,
            description: payload.description
        }
    }
    else if (_masterKey === "hearing-outcome") {
        maprequestbody = {
            outcomeCode: payload.code,
            outcomeName: payload.name,
            sortOrder: payload.sortOrder,
            active: true,
            description: payload.description
        }
    }
    else {
        maprequestbody = {
            code: payload.code,
            name: payload.name,
            sortOrder: payload.sortOrder,
            isActive: payload.isActive,
            description: payload.description
        }
    }

    return maprequestbody;

}
export const createMasterAsync = createAsyncThunk(
    'master/createMaster',
    async ({ masterKey, payload }: MasterMutationParams) => {

        const maprequestbody = createMasterDataMapping(masterKey, payload)
        const response = await restApi.masterService.createMaster(maprequestbody, masterKey)
        if (response?.errorMessage) {
            throw new Error(response.errorMessage)
        }

        return response?.data?.data || response?.data
    }
)

export const updateMasterAsync = createAsyncThunk(
    'master/updateMaster',
    async ({ masterKey, itemId, payload }: MasterMutationParams) => {
        if (!itemId) {
            throw new Error('Master item id is required')
        }

        // const body = { ...payload, id: itemId }
        const mapUpdateMasterbody = updateMasterDataMapping(masterKey, payload, itemId)

        const response = await restApi.masterService.updateMaster(mapUpdateMasterbody, masterKey, itemId)

        if (response?.errorMessage) {
            throw new Error(response.errorMessage)
        }

        return response?.data?.data || response?.data
    }
)

export const deleteMasterAsync = createAsyncThunk(
    'master/deleteMaster',
    async ({ masterKey, itemId }: DeleteMasterParams) => {
        console.log("Deleting master item with id:", itemId, "and masterKey:", masterKey);
        const response = await restApi.masterService.deleteMasterByIds(itemId, masterKey)

        if (response?.errorMessage) {
            throw new Error(response.errorMessage)
        }

        return itemId
    }
)

const masterSlice = createSlice({
    name: 'master',
    initialState,
    reducers: {
        clearError: (state) => {
            state.error = null
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchMastersAsync.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(fetchMastersAsync.fulfilled, (state, action) => {
                state.loading = false
                state.masterPageObj = action.payload
            })
            .addCase(fetchMastersAsync.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message || 'Failed to fetch masters'
            })
            .addCase(createMasterAsync.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(createMasterAsync.fulfilled, (state) => {
                state.loading = false
            })
            .addCase(createMasterAsync.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message || 'Failed to create master'
            })
            .addCase(updateMasterAsync.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(updateMasterAsync.fulfilled, (state) => {
                state.loading = false
            })
            .addCase(updateMasterAsync.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message || 'Failed to update master'
            })
            .addCase(deleteMasterAsync.pending, (state) => {
                state.loading = true
                state.error = null
            })
            .addCase(deleteMasterAsync.fulfilled, (state) => {
                state.loading = false
            })
            .addCase(deleteMasterAsync.rejected, (state, action) => {
                state.loading = false
                state.error = action.error.message || 'Failed to delete master'
            })
    }
})

export const { clearError } = masterSlice.actions
export default masterSlice.reducer