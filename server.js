import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { AnalysisType } from './public/types.js';

// --- Setup ---
const app = express();
const port = process.env.PORT || 3001;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Environment Variables Check ---
if (!process.env.API_KEY) {
    console.error("FATAL ERROR: API_KEY environment variable is not set.");
    process.exit(1);
}
if (!process.env.GOOGLE_CLIENT_ID) {
    console.error("FATAL ERROR: GOOGLE_CLIENT_ID environment variable is not set.");
    process.exit(1);
}

// --- Gemini AI Client ---
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Middleware ---
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// --- API Routes ---

app.get('/api/config', (req, res) => {
    res.json({ googleClientId: process.env.GOOGLE_CLIENT_ID });
});

const getPromptForAnalysisType = (type) => {
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

app.post('/api/analyze', async (req, res) => {
    const { gaData, analysisType } = req.body;

    if (!gaData || !analysisType) {
        return res.status(400).json({ error: 'Brak gaData lub analysisType w ciele żądania.' });
    }
    
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
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.3,
                topP: 0.95,
                topK: 40,
            }
        });
        res.json({ result: response.text });
    } catch (error) {
        console.error("Gemini API call failed:", error);
        const errorMessage = error instanceof Error ? error.message : 'Wystąpił nieoczekiwany błąd.';
        res.status(500).json({ error: `Błąd komunikacji z API Gemini: ${errorMessage}` });
    }
});

// Serve index.html for all other routes to enable client-side routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// --- Start Server ---
app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
