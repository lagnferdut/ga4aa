import { AnalysisType } from './types.js';
import { ChartBarIcon, DocumentTextIcon, LightBulbIcon, UsersIcon } from './components/icons.js';

export const ANALYSIS_OPTIONS = [
    {
        id: AnalysisType.GENERAL,
        label: 'Ogólne podsumowanie',
        icon: DocumentTextIcon,
    },
    {
        id: AnalysisType.TRENDS,
        label: 'Identyfikacja trendów',
        icon: ChartBarIcon,
    },
    {
        id: AnalysisType.BEHAVIOR,
        label: 'Analiza zachowania',
        icon: LightBulbIcon,
    },
    {
        id: AnalysisType.ACQUISITION,
        label: 'Analiza Pozyskiwania',
        icon: UsersIcon,
    },
];
