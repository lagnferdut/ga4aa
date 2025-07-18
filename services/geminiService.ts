

import { GoogleGenAI } from "@google/genai";
import { AnalysisType } from '../types';

if (!process.env.API_KEY) {
    throw new Error("API_KEY environment variable not set. Please set it to use the Gemini API.");
}

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const getPromptForAnalysisType = (type: AnalysisType): string => {
    switch (type) {
        case AnalysisType.ACQUISITION:
            return `
                Jako ekspert od marketingu cyfrowego i analityki, Twoim zadaniem jest analiza pozyskiwania użytkowników na podstawie danych z Google Analytics.
                - Zidentyfikuj i porównaj najskuteczniejsze kanały pozyskiwania (source/medium) pod względem liczby użytkowników i sesji.
                - Które kanały generują najbardziej zaangażowany ruch? Porównaj metryki takie jak współczynnik zaangażowania, średni czas sesji i konwersje dla poszczególnych kanałów.
                - Wskaż, czy istnieją kanały o niewykorzystanym potencjale lub takie, których skuteczność spada.
                - Na podstawie danych, przedstaw 3-5 praktycznych rekomendacji dotyczących optymalizacji strategii pozyskiwania ruchu.
                - Przedstaw analizę w ustrukturyzowanej formie. Użyj list i nagłówków, aby oddzielić analizę poszczególnych kanałów i końcowe rekomendacje.
            `;
        case AnalysisType.TRENDS:
            return `
                Jako ekspert od analityki internetowej, Twoim zadaniem jest zidentyfikowanie kluczowych trendów w dostarczonych danych z Google Analytics.
                - Skup się na zmianach w czasie. Czy ogólny ruch rośnie, maleje czy jest stabilny?
                - Które kanały pozyskiwania ruchu (source/medium) zyskują na popularności, a które tracą?
                - Czy widać jakieś istotne trendy w zaangażowaniu użytkowników (np. średni czas sesji, współczynnik zaangażowania)?
                - Zidentyfikuj strony lub produkty, których popularność rośnie lub spada.
                - Przedstaw swoje wnioski w formie klarownych, punktowanych list. Wyróżnij najważniejsze odkrycia.
            `;
        case AnalysisType.BEHAVIOR:
            return `
                Jako ekspert od UX i analityki, Twoim zadaniem jest dogłębna analiza zachowania użytkowników na podstawie dostarczonych danych z Google Analytics.
                - Zidentyfikuj najczęstsze ścieżki, którymi poruszają się użytkownicy. Jakie są najpopularniejsze strony wejścia i wyjścia?
                - Które strony mają najwyższy współczynnik wyjść (exit rate)? Co może być tego przyczyną?
                - Przeanalizuj zaangażowanie na kluczowych stronach. Gdzie użytkownicy spędzają najwięcej czasu, a które strony opuszczają najszybciej?
                - Na podstawie analizy, zasugeruj 3-5 konkretnych, praktycznych rekomendacji dotyczących ulepszeń UX/UI, które mogą poprawić zaangażowanie i konwersję.
                - Przedstaw swoje wnioski w sposób ustrukturyzowany, dzieląc je na obserwacje i rekomendacje.
            `;
        case AnalysisType.GENERAL:
        default:
            return `
                Jako starszy analityk danych, Twoim zadaniem jest stworzenie zwięzłego, ale kompleksowego podsumowania (Executive Summary) na podstawie dostarczonych danych z Google Analytics.
                - Podsumuj absolutnie kluczowe wskaźniki (KPIs), takie jak: całkowita liczba użytkowników, sesji, odsłon.
                - Wskaż średni czas trwania sesji i współczynnik zaangażowania.
                - Zidentyfikuj 3-5 najskuteczniejszych kanałów pozyskiwania ruchu (source/medium).
                - Wymień 3-5 najpopularniejszych stron (landing pages).
                - Zakończ jednoznacznym, dwuzdaniowym wnioskiem na temat ogólnej kondycji witryny w analizowanym okresie.
            `;
    }
};

export const analyzeGaData = async (gaData: string, analysisType: AnalysisType): Promise<string> => {
    const model = 'gemini-2.5-flash';
    const specificInstructions = getPromptForAnalysisType(analysisType);

    const prompt = `
        ${specificInstructions}

        Format odpowiedzi:
        - Używaj nagłówków (np. ### Mój Nagłówek) do strukturyzacji odpowiedzi.
        - Używaj list punktowanych (* Moja obserwacja) dla przejrzystości.
        - Używaj pogrubień (**ważne słowo**), aby podkreślić kluczowe terminy lub metryki.
        - Odpowiadaj wyłącznie w języku polskim.
        - Nie używaj bloków kodu w odpowiedzi.

        Oto dane do analizy:
        ---
        ${gaData}
        ---
    `;

    try {
        const response = await ai.models.generateContent({
            model: model,
            contents: prompt,
            config: {
                temperature: 0.3,
                topP: 0.95,
                topK: 40,
            }
        });
        
        return response.text;
    } catch (error) {
        console.error("Gemini API call failed:", error);
        if (error instanceof Error) {
            return Promise.reject(new Error(`Błąd komunikacji z API Gemini: ${error.message}`));
        }
        return Promise.reject(new Error("Błąd komunikacji z API Gemini."));
    }
};