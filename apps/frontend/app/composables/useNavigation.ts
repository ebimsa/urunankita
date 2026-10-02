import { ref } from 'vue'

export type NavTab = 'DASHBOARD' | 'LEDGER' | 'MEMBERS' | 'UNITS'

const activeTab = ref<NavTab>('DASHBOARD')

export const useNavigation = () => {
  const setActiveTab = (tab: NavTab) => {
    activeTab.value = tab
  }

  return {
    activeTab,
    setActiveTab,
  }
}
