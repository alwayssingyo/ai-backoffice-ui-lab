import {create} from "zustand";
import {combine, createJSONStorage, persist} from "zustand/middleware";

type EntryColumnVisibilityState = {visibleColumnNamesByTable: Record<string, string[]>};

type EntryColumnVisibilityAction = {setVisibleColumnNames: (tableName: string, columnNames: string[]) => void; reset: () => void};

export const useEntryColumnVisibilityStore = create<EntryColumnVisibilityState & EntryColumnVisibilityAction>()(
	persist(
		combine({visibleColumnNamesByTable: {}}, (set) => ({
			setVisibleColumnNames: (tableName: string, columnNames: string[]) => {
				set((state) => ({visibleColumnNamesByTable: {...state.visibleColumnNamesByTable, [tableName]: columnNames}}));
			},
			reset: () => {
				set({visibleColumnNamesByTable: {}});
			},
		})),
		{name: "ecv_s", storage: createJSONStorage(() => localStorage)},
	),
);
