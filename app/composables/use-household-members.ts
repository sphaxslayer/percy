/**
 * app/composables/use-household-members.ts — Shared composable for household members.
 * Used by TodoAtHome for task assignment, and potentially by other skills.
 */
import { computed } from 'vue';
import { useCrudList } from './use-crud-list';
import { API } from '~/lib/routes';
import type { HouseholdMember } from '~/types/todo';

type MemberCreateInput = { name: string; avatar?: string; role?: string };
type MemberUpdateInput = Partial<Pick<HouseholdMember, 'name' | 'avatar' | 'role'>>;

export function useHouseholdMembers() {
  const crud = useCrudList<HouseholdMember, MemberCreateInput, MemberUpdateInput>({
    baseUrl: API.household.members,
    fetchErrorMessage: 'Impossible de charger les membres du foyer',
  });

  const memberCount = computed(() => crud.items.value.length);

  function getMemberById(id: string) {
    return crud.items.value.find((m) => m.id === id) ?? null;
  }

  return {
    members: crud.items,
    loading: crud.loading,
    error: crud.error,
    memberCount,
    fetchMembers: crud.fetchAll,
    addMember: crud.add,
    updateMember: crud.update,
    removeMember: crud.remove,
    getMemberById,
  };
}
