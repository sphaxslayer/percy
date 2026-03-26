/**
 * Unit tests for the household members composable.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useHouseholdMembers } from '~/composables/use-household-members';

const mockFetch = vi.fn();
vi.stubGlobal('$fetch', mockFetch);

const TEST_MEMBER = {
  id: 'member-1',
  name: 'Moi',
  avatar: '👤',
  role: 'parent',
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00.000Z',
};

describe('useHouseholdMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetchMembers populates the list', async () => {
    mockFetch.mockResolvedValue({ data: [TEST_MEMBER] });
    const { members, fetchMembers, memberCount } = useHouseholdMembers();

    await fetchMembers();

    expect(members.value).toEqual([TEST_MEMBER]);
    expect(memberCount.value).toBe(1);
    expect(mockFetch).toHaveBeenCalledWith('/api/household/members');
  });

  it('fetchMembers sets error on failure', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const { error, fetchMembers } = useHouseholdMembers();

    await fetchMembers();

    expect(error.value).toBe('Impossible de charger les membres du foyer');
  });

  it('addMember appends to members list', async () => {
    mockFetch.mockResolvedValue({ data: TEST_MEMBER });
    const { members, addMember } = useHouseholdMembers();

    const result = await addMember({ name: 'Moi', avatar: '👤' });

    expect(result).toEqual(TEST_MEMBER);
    expect(members.value).toHaveLength(1);
  });

  it('updateMember replaces in members list', async () => {
    const updated = { ...TEST_MEMBER, name: 'Papa' };
    mockFetch
      .mockResolvedValueOnce({ data: [TEST_MEMBER] })
      .mockResolvedValueOnce({ data: updated });

    const { members, fetchMembers, updateMember } = useHouseholdMembers();
    await fetchMembers();
    await updateMember('member-1', { name: 'Papa' });

    expect(members.value[0]!.name).toBe('Papa');
  });

  it('removeMember filters from members list', async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [TEST_MEMBER] })
      .mockResolvedValueOnce({});

    const { members, fetchMembers, removeMember } = useHouseholdMembers();
    await fetchMembers();
    await removeMember('member-1');

    expect(members.value).toHaveLength(0);
  });

  it('getMemberById returns the right member', async () => {
    mockFetch.mockResolvedValue({ data: [TEST_MEMBER] });
    const { fetchMembers, getMemberById } = useHouseholdMembers();
    await fetchMembers();

    expect(getMemberById('member-1')).toEqual(TEST_MEMBER);
    expect(getMemberById('nope')).toBeNull();
  });
});
