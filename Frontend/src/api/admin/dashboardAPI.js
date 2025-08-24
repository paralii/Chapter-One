import adminAxios from "../adminAxios";

export const getDashboardStats = () =>{
    return adminAxios.get('/dashboard/overview')
}

export const getTopProducts = () =>{
    return adminAxios.get('/dashboard/top-products')
}

export const getTopCategories = () =>{
    return adminAxios.get('/dashboard/top-categories')
}

export const generateLedgerBook = () =>{
    return adminAxios.get('/dashboard/ledger')
}
