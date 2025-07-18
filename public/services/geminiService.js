export const analyzeGaData = async (gaData, analysisType) => {
    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ gaData, analysisType }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Błąd serwera podczas analizy danych.');
        }

        return data.result;
    } catch (error) {
        console.error("Failed to analyze data:", error);
        const errorMessage = error instanceof Error ? error.message : "Wystąpił nieznany błąd.";
        return Promise.reject(new Error(`Błąd komunikacji z serwerem: ${errorMessage}`));
    }
};
