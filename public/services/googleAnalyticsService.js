import { AnalysisType } from '../types.js';

const ADMIN_API_URL = 'https://analyticsadmin.googleapis.com/v1beta';
const DATA_API_URL = 'https://analyticsdata.googleapis.com/v1beta';

async function fetchWithAuth(url, token, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Request to Google API failed');
    }
    return response.json();
}

export async function listAccounts(token) {
    const data = await fetchWithAuth(`${ADMIN_API_URL}/accountSummaries`, token);
    return data.accountSummaries.map((summary) => ({
        name: summary.account,
        displayName: summary.displayName,
    }));
}

export async function listProperties(accountName, token) {
    const data = await fetchWithAuth(`${ADMIN_API_URL}/accountSummaries?parent=${accountName}`, token);
    const accountSummary = data.accountSummaries.find((summary) => summary.account === accountName);
    if (!accountSummary || !accountSummary.propertySummaries) return [];
    
    return accountSummary.propertySummaries.map((summary) => ({
        name: summary.property,
        displayName: summary.displayName,
    }));
}


const getReportRequestConfig = (analysisType) => {
    // Common config for all reports
    const baseConfig = {
        dateRanges: [{ startDate: "30daysAgo", endDate: "today" }],
        limit: 250,
    };

    switch(analysisType) {
        case AnalysisType.ACQUISITION:
            return {
                ...baseConfig,
                dimensions: [{ name: "sessionSourceMedium" }, { name: "firstUserSourceMedium" }],
                metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "engagementRate" }, { name: "averageSessionDuration" }]
            };
        case AnalysisType.BEHAVIOR:
            return {
                ...baseConfig,
                dimensions: [{ name: "pagePath" }, { name: "landingPage" }],
                metrics: [{ name: "screenPageViews" }, { name: "userEngagementDuration" }, { name: "exits" }]
            };
        case AnalysisType.TRENDS:
             return {
                ...baseConfig,
                dimensions: [{ name: "date" }],
                metrics: [{ name: "totalUsers" }, { name: "sessions" }],
                orderBys: [{ dimension: { orderType: "ALPHANUMERIC", dimensionName: "date" } }]
            };
        case AnalysisType.GENERAL:
        default:
             return {
                ...baseConfig,
                dimensions: [{ name: "pagePath" }, { name: "sessionSourceMedium" }],
                metrics: [{ name: "totalUsers" }, { name: "sessions" }, { name: "engagementRate" }, { name: "screenPageViews" }]
            };
    }
}


export async function runReport(propertyId, token, analysisType) {
    const requestBody = getReportRequestConfig(analysisType);
    
    const url = `${DATA_API_URL}/${propertyId}:runReport`;
    const data = await fetchWithAuth(url, token, {
        method: 'POST',
        body: JSON.stringify(requestBody),
    });

    if (!data.rows || data.rows.length === 0) {
        return "Brak danych do analizy dla wybranego okresu i ustawień.";
    }

    // Convert the report data to a simple CSV-like string for Gemini
    const headers = [...data.dimensionHeaders.map((h) => h.name), ...data.metricHeaders.map((h) => h.name)];
    let csvString = headers.join(',') + '\n';

    data.rows.forEach((row) => {
        const dimensionValues = row.dimensionValues.map((dv) => dv.value).join(',');
        const metricValues = row.metricValues.map((mv) => mv.value).join(',');
        csvString += `${dimensionValues},${metricValues}\n`;
    });

    return csvString;
}
