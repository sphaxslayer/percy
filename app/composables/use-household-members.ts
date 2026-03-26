/**
 * app/composables/use-household-members.ts — Shared composable for household members.
 * Used by TodoAtHome for task assignment, and potentially by other skills.
 */
import { ref, computed } from 'vue';
import type { HouseholdMember } from '~/types/todo';

const API_BASE = '/api/household/members';

export function useHouseholdMembers() {
  const members = ref<HouseholdMember[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const memberCount = computed(() => members.value.length);

  async function fetchMembers() {
    loading.value = true;
    error.value = null;
    try {
      const res = await $fetch<{ data: HouseholdMember[] }>(API_BASE);
      members.value = res.data;
    } catch {
      error.value = 'Impossible de charger les membres du foyer';
    } finally {
      loading.value = false;
    }
  }

  async function addMember(input: { name: string; avatar?: string; role?: string }) {
    const res = await $fetch<{ data: HouseholdMember }>(API_BASE, {
      method: 'POST',
      body: input,
    });
    members.value = [...members.value, res.data];
    return res.data;
  }

  async function updateMember(id: string, data: Partial<Pick<HouseholdMember, 'name' | 'avatar' | 'role'>>) {
    const res = await $fetch<{ data: HouseholdMember }>(`${API_BASE}/${id}`, {
      method: 'PATCH',
      body: data,
    });
    members.value = members.value.map((m) => (m.id === id ? res.data : m));
    return res.data;
  }

  async function removeMember(id: string) {
    await $fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    members.value = members.value.filter((m) => m.id !== id);
  }

  function getMemberById(id: string) {
    return members.value.find((m) => m.id === id) ?? null;
  }

  return {
    members,
    loading,
    error,
    memberCount,
    fetchMembers,
    addMember,
    updateMember,
    removeMember,
    getMemberById,
  };
}
