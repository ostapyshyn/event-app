import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
  query,
} from "firebase/firestore";
import { toast } from "react-toastify";

import { usersCollectionRef } from "../../lib/firestore.collections";

import { db } from "../../lib/init-firebase";

const initialState = {
  status: null,
  error: null,
  members: [],
  selectAll: false,
};

export const getNewMembers = createAsyncThunk(
  "membersSlice/getNewMembers",
  async (_, { rejectWithValue, dispatch }) => {
    try {
      const q = query(usersCollectionRef, where("role", "==", "user"));
      const querySnap = await getDocs(q);

      const members = querySnap.docs.map(async (doc) => {
        const snapRef = collection(db, `users/${doc.id}/eventsList`);
        const allEvents = await getDocs(snapRef);
        return {
          ...doc.data(),
          id: doc.id,
          eventsList: allEvents
            ? allEvents?.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
              }))
            : [],
        };
      });

      const result = await Promise.all(members);

      dispatch(getMembers(result));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

//connect
export const addEventToMember = createAsyncThunk(
  "membersSlice/addEventToMember",
  async (event, { rejectWithValue, dispatch }) => {
    try {
      const docRef = doc(db, "users", event.uid);
      const colRef = collection(docRef, "eventsList");
      await setDoc(doc(colRef, event.id), event);
      dispatch(addEvent(event));
    } catch (error) {
      toast.error("Sorry, Can't register user");
      return rejectWithValue(error);
    }
  }
);

export const deleteEventFromMember = createAsyncThunk(
  "membersSlice/deleteEventFromMember",
  async ({ uid, id }, { rejectWithValue, dispatch }) => {
    try {
      const docRef = doc(db, "users", uid);
      console.log(docRef);
      const colRef = collection(docRef, "eventsList");
      await deleteDoc(doc(colRef, id));
      dispatch(deleteEvent({ uid, id }));
    } catch (error) {
      toast.error("Sorry, can't delete user");
      return rejectWithValue(error);
    }
  }
);

export const toggleStatus = createAsyncThunk(
  "membersSlice/toggleStatus",
  async ({ uid, id }, { rejectWithValue, dispatch, getState }) => {
    const currentMember = getState().membersSlice.members.find(
      (member) => member.id === uid
    );
    const currentEvent = currentMember.eventsList.find(
      (event) => event.id === id
    );
    try {
      const docRef = doc(db, "users", uid);
      const colRef = collection(docRef, "eventsList");
      await updateDoc(doc(colRef, id), { isPresent: !currentEvent.isPresent });
      dispatch(toggleEvent({ uid, id }));
    } catch (error) {
      toast.error("Sorry, can't check user");
      return rejectWithValue(error.message);
    }
  }
);

export const updateAdditionalInfo = createAsyncThunk(
  "membersSlice/updateAdditionalInfo",
  async (
    { uid, id, comment, additionalPoints },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const docRef = doc(db, "users", uid);
      const colRef = collection(docRef, "eventsList");
      await updateDoc(doc(colRef, id), {
        comment: comment,
        additionalPoints: additionalPoints,
      });
      dispatch(updateInfo({ uid, id, comment, additionalPoints }));
      toast.success("Additional information was saved successfully");
    } catch (error) {
      toast.error("Sorry, can't save additional information");
      return rejectWithValue(error.message);
    }
  }
);

export const deleteAllMembersFromEvent = createAsyncThunk(
  "membersSlice/deleteAllMembersFromEvent",
  async (id, { rejectWithValue, getState, dispatch }) => {
    const membersList = getState().eventSlice.event.membersList;

    try {
      for (let i = 0; i < membersList.length; i++) {
        const docRef = doc(db, "users", membersList[i]);
        const colRef = collection(docRef, "eventsList");
        await deleteDoc(doc(colRef, id));
        dispatch(deleteEvent({ uid: membersList[i], id }));
      }
    } catch (error) {
      toast.error("Sorry, can't delete event");
      return rejectWithValue(error.message);
    }
  }
);

export const addEventToAllMembers = createAsyncThunk(
  "membersSlice/addAllMembersToEvent",
  async (event, { rejectWithValue, getState, dispatch }) => {
    const members = getState().membersSlice.members;

    const membersList = getState().eventSlice.event.membersList;
    const unregisteredMem = members.filter(
      (member) => !membersList.includes(member.id)
    );

    try {
      unregisteredMem.map(async (member) => {
        const docRef = doc(db, "users", member.id);
        const colRef = collection(docRef, "eventsList");
        await setDoc(doc(colRef, event.id), event);
        dispatch(addEvent({ ...event, uid: member.id }));
      });
    } catch (error) {
      toast.error("Sorry, can't register all users");
      return rejectWithValue(error.message);
    }
  }
);

export const showIsPresentForAllMembers = createAsyncThunk(
  "membersSlice/showIsPresentToAllMembers",
  async (id, { rejectWithValue, getState, dispatch }) => {
    const membersList = getState().eventSlice.event.membersList;
    try {
      for (let i = 0; i < membersList.length; i++) {
        const docRef = doc(db, "users", membersList[i]);
        const colRef = collection(docRef, "eventsList");
        await updateDoc(doc(colRef, id), { isPresent: true });
        dispatch(showIsPresent({ uid: membersList[i], id }));
      }
    } catch (error) {
      return rejectWithValue("Sorry, can't select all users");
    }
  }
);

export const hideIsPresentForAllMembers = createAsyncThunk(
  "membersSlice/hideIsPresentToAllMembers",
  async (id, { rejectWithValue, getState, dispatch }) => {
    const membersList = getState().eventSlice.event.membersList;
    try {
      for (let i = 0; i < membersList.length; i++) {
        const docRef = doc(db, "users", membersList[i]);
        const colRef = collection(docRef, "eventsList");
        await updateDoc(doc(colRef, id), { isPresent: false });
        dispatch(hideIsPresent({ uid: membersList[i], id }));
      }
    } catch (error) {
      return rejectWithValue("Sorry, can't take selecting back");
    }
  }
);

// helpers
const setSuccess = (state) => {
  state.status = "succeeded";
};
const setError = (state, action) => {
  state.status = "failed";
  state.error = action.payload;
};

const setLoading = (state) => {
  state.status = "loading";
  state.error = null;
};

const membersSlice = createSlice({
  name: "membersSlice",
  initialState,
  reducers: {
    getMembers(state, action) {
      state.members = action.payload;
    },

    addEvent(state, action) {
      const { uid } = action.payload;
      console.log(action.payload);
      const currentMember = state.members.find((member) => member.id === uid);
      currentMember.eventsList.push(action.payload);
    },
    deleteEvent(state, action) {
      const { uid, id } = action.payload;
      const currentMember = state.members.find((member) => member.id === uid);
      currentMember.eventsList = currentMember.eventsList.filter(
        (member) => member.id !== id
      );
    },
    toggleEvent(state, action) {
      const { uid, id } = action.payload;
      const currentMember = state.members.find((member) => member.id === uid);
      const currentInfo = currentMember.eventsList.find(
        (info) => info.id === id
      );
      currentInfo.isPresent = !currentInfo.isPresent;
    },
    updateInfo(state, action) {
      const { uid, id, comment, additionalPoints } = action.payload;
      const currentMember = state.members.find((member) => member.id === uid);

      const currentInfo = currentMember.eventsList.find(
        (info) => info.id === id
      );
      currentInfo.comment = comment;
      currentInfo.additionalPoints = additionalPoints;
    },
    toggleSelectAll(state) {
      state.selectAll = !state.selectAll;
    },
    showIsPresent(state, action) {
      const { uid, id } = action.payload;
      const currentMember = state.members.find((member) => member.id === uid);
      const currentInfo = currentMember.eventsList.find(
        (info) => info.id === id
      );
      currentInfo.isPresent = true;
    },
    hideIsPresent(state, action) {
      const { uid, id } = action.payload;
      const currentMember = state.members.find((member) => member.id === uid);
      const currentInfo = currentMember.eventsList.find(
        (info) => info.id === id
      );
      currentInfo.isPresent = false;
    },
  },
  extraReducers: {
    [getNewMembers.fulfilled]: setSuccess,
    [getNewMembers.rejected]: setError,
    [getNewMembers.pending]: setLoading,
    [addEventToMember.fulfilled]: setSuccess,
    [addEventToMember.rejected]: setError,
    [addEventToMember.pending]: setLoading,
    [deleteEventFromMember.fulfilled]: setSuccess,
    [deleteEventFromMember.rejected]: setError,
    [deleteEventFromMember.pending]: setLoading,
    [toggleStatus.fulfilled]: setSuccess,
    [toggleStatus.rejected]: setError,
    [toggleStatus.pending]: setLoading,
    [updateAdditionalInfo.fulfilled]: setSuccess,
    [updateAdditionalInfo.rejected]: setError,
    [updateAdditionalInfo.pending]: setLoading,
    [deleteAllMembersFromEvent.fulfilled]: setSuccess,
    [deleteAllMembersFromEvent.rejected]: setError,
    [deleteAllMembersFromEvent.pending]: setLoading,
    [addEventToAllMembers.fulfilled]: setSuccess,
    [addEventToAllMembers.rejected]: setError,
    [addEventToAllMembers.pending]: setLoading,
    [showIsPresentForAllMembers.fulfilled]: setSuccess,
    [showIsPresentForAllMembers.rejected]: setError,
    [showIsPresentForAllMembers.pending]: setLoading,
    [hideIsPresentForAllMembers.fulfilled]: setSuccess,
    [hideIsPresentForAllMembers.rejected]: setError,
    [hideIsPresentForAllMembers.pending]: setLoading,
  },
});
export const {
  getMembers,
  addEvent,
  deleteEvent,
  toggleEvent,
  updateInfo,
  toggleSelectAll,
  showIsPresent,
  hideIsPresent,
} = membersSlice.actions;
export default membersSlice.reducer;
