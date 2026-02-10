'use client';

/**
 * Edit Mode Provider
 *
 * Manages state for editing pages and blocks.
 * Provides context for block selection, updates, and saving.
 */

import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import type { Page } from '@/core/content/types';
import type { BlockInstance } from '@/core/blocks/types';

// =============================================================================
// TYPES
// =============================================================================

interface EditModeState {
  page: Page;
  originalPage: Page;
  selectedBlockId: string | null;
  editMode: 'properties' | 'ai';
  isDirty: boolean;
  isSaving: boolean;
  error: string | null;
}

type EditModeAction =
  | { type: 'SELECT_BLOCK'; blockId: string | null }
  | { type: 'UPDATE_BLOCK'; blockId: string; props: unknown }
  | { type: 'ADD_BLOCK'; block: BlockInstance; afterBlockId?: string }
  | { type: 'DELETE_BLOCK'; blockId: string }
  | { type: 'REORDER_BLOCKS'; fromIndex: number; toIndex: number }
  | { type: 'UPDATE_PAGE'; updates: Partial<Page> }
  | { type: 'SAVE_START' }
  | { type: 'SAVE_SUCCESS'; page: Page }
  | { type: 'SAVE_ERROR'; error: string }
  | { type: 'SET_EDIT_MODE'; mode: 'properties' | 'ai' }
  | { type: 'DISCARD' };

interface EditModeContextValue {
  state: EditModeState;
  selectedBlock: BlockInstance | null;
  selectBlock: (blockId: string | null) => void;
  setEditMode: (mode: 'properties' | 'ai') => void;
  updateBlock: (blockId: string, props: unknown) => void;
  addBlock: (block: BlockInstance, afterBlockId?: string) => void;
  deleteBlock: (blockId: string) => void;
  reorderBlocks: (fromIndex: number, toIndex: number) => void;
  updatePage: (updates: Partial<Page>) => void;
  save: () => Promise<void>;
  discard: () => void;
}

// =============================================================================
// REDUCER
// =============================================================================

function editModeReducer(state: EditModeState, action: EditModeAction): EditModeState {
  switch (action.type) {
    case 'SELECT_BLOCK':
      return { ...state, selectedBlockId: action.blockId };

    case 'UPDATE_BLOCK': {
      const blocks = state.page.blocks.map((block) =>
        block.id === action.blockId ? { ...block, props: action.props } : block
      );
      return {
        ...state,
        page: { ...state.page, blocks },
        isDirty: true,
      };
    }

    case 'ADD_BLOCK': {
      const blocks = [...state.page.blocks];
      if (action.afterBlockId) {
        const index = blocks.findIndex((b) => b.id === action.afterBlockId);
        blocks.splice(index + 1, 0, action.block);
      } else {
        blocks.push(action.block);
      }
      return {
        ...state,
        page: { ...state.page, blocks },
        isDirty: true,
        selectedBlockId: action.block.id,
      };
    }

    case 'DELETE_BLOCK': {
      const blocks = state.page.blocks.filter((b) => b.id !== action.blockId);
      return {
        ...state,
        page: { ...state.page, blocks },
        isDirty: true,
        selectedBlockId:
          state.selectedBlockId === action.blockId ? null : state.selectedBlockId,
      };
    }

    case 'REORDER_BLOCKS': {
      const blocks = [...state.page.blocks];
      const [moved] = blocks.splice(action.fromIndex, 1);
      blocks.splice(action.toIndex, 0, moved);
      return {
        ...state,
        page: { ...state.page, blocks },
        isDirty: true,
      };
    }

    case 'UPDATE_PAGE':
      return {
        ...state,
        page: { ...state.page, ...action.updates },
        isDirty: true,
      };

    case 'SAVE_START':
      return { ...state, isSaving: true, error: null };

    case 'SAVE_SUCCESS':
      return {
        ...state,
        page: action.page,
        originalPage: action.page,
        isSaving: false,
        isDirty: false,
      };

    case 'SAVE_ERROR':
      return { ...state, isSaving: false, error: action.error };

    case 'SET_EDIT_MODE':
      return { ...state, editMode: action.mode };

    case 'DISCARD':
      return {
        ...state,
        page: state.originalPage,
        isDirty: false,
        selectedBlockId: null,
        error: null,
      };

    default:
      return state;
  }
}

// =============================================================================
// CONTEXT
// =============================================================================

const EditModeContext = createContext<EditModeContextValue | null>(null);

// =============================================================================
// PROVIDER
// =============================================================================

interface EditModeProviderProps {
  page: Page;
  children: ReactNode;
}

export function EditModeProvider({ page, children }: EditModeProviderProps) {
  const [state, dispatch] = useReducer(editModeReducer, {
    page,
    originalPage: page,
    selectedBlockId: null,
    editMode: 'properties' as const,
    isDirty: false,
    isSaving: false,
    error: null,
  });

  const selectedBlock = useMemo(
    () => state.page.blocks.find((b) => b.id === state.selectedBlockId) || null,
    [state.page.blocks, state.selectedBlockId]
  );

  const selectBlock = useCallback((blockId: string | null) => {
    dispatch({ type: 'SELECT_BLOCK', blockId });
  }, []);

  const setEditMode = useCallback((mode: 'properties' | 'ai') => {
    dispatch({ type: 'SET_EDIT_MODE', mode });
  }, []);

  const updateBlock = useCallback((blockId: string, props: unknown) => {
    dispatch({ type: 'UPDATE_BLOCK', blockId, props });
  }, []);

  const addBlock = useCallback((block: BlockInstance, afterBlockId?: string) => {
    dispatch({ type: 'ADD_BLOCK', block, afterBlockId });
  }, []);

  const deleteBlock = useCallback((blockId: string) => {
    dispatch({ type: 'DELETE_BLOCK', blockId });
  }, []);

  const reorderBlocks = useCallback((fromIndex: number, toIndex: number) => {
    dispatch({ type: 'REORDER_BLOCKS', fromIndex, toIndex });
  }, []);

  const updatePage = useCallback((updates: Partial<Page>) => {
    dispatch({ type: 'UPDATE_PAGE', updates });
  }, []);

  const save = useCallback(async () => {
    dispatch({ type: 'SAVE_START' });

    try {
      const response = await fetch(`/api/admin/pages/${state.page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          blocks: state.page.blocks,
          title: state.page.title,
          seo: state.page.seo,
          changeDescription: 'Edited via chat editor',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save');
      }

      const updatedPage = await response.json();
      dispatch({ type: 'SAVE_SUCCESS', page: updatedPage });
    } catch (error) {
      dispatch({
        type: 'SAVE_ERROR',
        error: error instanceof Error ? error.message : 'Failed to save',
      });
    }
  }, [state.page]);

  const discard = useCallback(() => {
    dispatch({ type: 'DISCARD' });
  }, []);

  const value = useMemo(
    () => ({
      state,
      selectedBlock,
      selectBlock,
      setEditMode,
      updateBlock,
      addBlock,
      deleteBlock,
      reorderBlocks,
      updatePage,
      save,
      discard,
    }),
    [
      state,
      selectedBlock,
      selectBlock,
      setEditMode,
      updateBlock,
      addBlock,
      deleteBlock,
      reorderBlocks,
      updatePage,
      save,
      discard,
    ]
  );

  return (
    <EditModeContext.Provider value={value}>{children}</EditModeContext.Provider>
  );
}

// =============================================================================
// HOOK
// =============================================================================

export function useEditMode() {
  const context = useContext(EditModeContext);
  if (!context) {
    throw new Error('useEditMode must be used within EditModeProvider');
  }
  return context;
}
