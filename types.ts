import React from 'react';

export enum AnalysisType {
    GENERAL = 'general',
    TRENDS = 'trends',
    BEHAVIOR = 'behavior',
    ACQUISITION = 'acquisition',
}

export interface AnalysisOption {
    id: AnalysisType;
    label: string;
    icon: React.ElementType;
}

export interface GaAccount {
    name: string;
    displayName: string;
}

export interface GaProperty {
    name: string;
    displayName: string;
}