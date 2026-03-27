import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isAboutCubridOpen: false,
};

const appBarSlice = createSlice({
  name: 'appBar',
  initialState,
  reducers: {
    setAboutCubrid: (state, action) => {
      state.isAboutCubridOpen = action.payload;
    },
  },
});

export const { setAboutCubrid } = appBarSlice.actions;
export default appBarSlice.reducer;
