// @flow
import type { FSA } from 'types/redux';
import type { State } from 'reducers';

import { merge } from 'lodash';
import { ADD_MODULE, REMOVE_MODULE } from 'actions/timetables';

export const actionsToPersist = [ADD_MODULE, REMOVE_MODULE];
export const keyPathsToPersist = ['timetables'];

export const UNDO = 'UNDO';
export function undo(): FSA {
  return { type: UNDO, payload: {} };
}

export const REDO = 'REDO';
export function redo(): FSA {
  return { type: REDO, payload: {} };
}

// Should only be called by undo-middleware
export const PUSH_NEW_PRESENT_STATE = 'PUSH_NEW_PRESENT_STATE';
export function pushNewPresent<T>(newPresent: T): FSA {
  return { type: PUSH_NEW_PRESENT_STATE, payload: { newPresent } };
}

export type UndoHistoryState = {
  past: Array<Object>,
  present: Object,
  future: Array<Object>,
};

// Call the reducer with empty action to populate the initial state
const initialState: UndoHistoryState = {
  past: [],
  present: {},
  future: [],
};

export function undoHistoryReducer(
  state: UndoHistoryState = initialState,
  action: FSA,
): UndoHistoryState {
  const { past, present, future } = state;

  switch (action.type) {
    case UNDO: {
      if (past.length === 0) return state;
      const previous = past[past.length - 1];
      const newPast = past.slice(0, past.length - 1);
      return {
        past: newPast,
        present: previous,
        future: [present, ...future],
      };
    }
    case REDO: {
      if (future.length === 0) return state;
      const next = future[0];
      const newFuture = future.slice(1);
      return {
        past: [...past, present],
        present: next,
        future: newFuture,
      };
    }
    case PUSH_NEW_PRESENT_STATE: {
      return {
        past: [...past, present],
        present: action.payload.newPresent,
        future: [],
      };
    }
    default: {
      return state;
    }
  }
}

// Applies undo and redo actions on overall app state
// Merges state.undoHistory.present with state if action.type === {UNDO,REDO}
// Assumes state.undoHistory.present is the final present state
export function undoReducer(state: State, action: FSA): State {
  if (action.type === UNDO || action.type === REDO) {
    return merge(state.undoHistory.present, state);
  }
  return state;
}
