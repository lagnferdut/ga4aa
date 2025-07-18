

import { AnalysisType, AnalysisOption } from './types';
import { ChartBarIcon, DocumentTextIcon, LightBulbIcon, UsersIcon } from './components/icons';

export const ANALYSIS_OPTIONS: AnalysisOption[] = [
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