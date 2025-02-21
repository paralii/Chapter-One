import { configureStore } from '@reduxjs/toolkit';
import storage from 'redux-persist/lib/storage'; // For local storage
import { persistStore, persistReducer } from 'redux-persist';
import { combineReducers } from 'redux';
import adminReducer from './slices/adminSlice';

const persistConfig = {
    key: 'root',
    storage,
};

const rootReducer = combineReducers({
    admin: persistReducer(persistConfig, adminReducer),
});

const store = configureStore({
    reducer: rootReducer,
});

export const persistor = persistStore(store);
export default store;
