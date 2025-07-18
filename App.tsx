
import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { analyzeGaData } from './services/geminiService';
import { listAccounts, listProperties, runReport } from './services/googleAnalyticsService';
import { AnalysisType, GaAccount, GaProperty } from './types';
import { ANALYSIS_OPTIONS } from './constants';
import { SparklesIcon, ClipboardIcon, ChartBarIcon, DocumentTextIcon, LightBulbIcon, CheckIcon, UsersIcon, ArrowPathIcon } from './components/icons';

// Krok 1: Wklej tutaj swój identyfikator klienta Google OAuth.
// Możesz go uzyskać z konsoli Google Cloud: https://console.cloud.google.com/apis/credentials
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "371923349783-0eptlkkdlsf9c4ktkl8ga9e13eqc0sl7.apps.googleusercontent.com";

declare global {
    interface Window {
        marked: { parse: (markdown: string) => string; };
        google: any;
    }
}

const Header: React.FC = () => (
  <header className="text-center p-4 md:p-6">
    <div className="flex justify-center items-center gap-4 mb-4">
        <div className="p-3 bg-emerald-900/50 rounded-full">
            <ChartBarIcon className="w-10 h-10 text-brand-primary" />
        </div>
    </div>
    <h1 className="text-4xl md:text-5xl font-bold text-brand-text tracking-tight">
      Analizator Google Analytics z AI
    </h1>
    <p className="mt-4 max-w-2xl mx-auto text-lg text-brand-subtle">
      Zaloguj się, wybierz usługę GA4 i rodzaj analizy, a Gemini dostarczy Ci cenne wnioski.
    </p>
  </header>
);

const GoogleLoginButton: React.FC<{onLoginSuccess: (tokenResponse: any) => void;}> = ({ onLoginSuccess }) => {
    const handleGoogleLogin = useCallback(() => {
        if (!window.google) {
            alert("Biblioteka Google nie została załadowana.");
            return;
        }
        const client = window.google.accounts.oauth2.initTokenClient({
            client_id: GOOGLE_CLIENT_ID,
            scope: 'https://www.googleapis.com/auth/analytics.readonly',
            callback: onLoginSuccess,
        });
        client.requestAccessToken();
    }, [onLoginSuccess]);

    if(GOOGLE_CLIENT_ID === "TUTAJ_WKLEJ_SWOJ_IDENTYFIKATOR_KLIENTA_GOOGLE") {
        return <ErrorMessage message="Aby aktywować logowanie, wklej swój identyfikator klienta Google w pliku App.tsx w zmiennej GOOGLE_CLIENT_ID." />;
    }

    return (
        <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex justify-center items-center gap-3 text-lg font-bold bg-white text-gray-800 py-3 px-6 rounded-lg hover:bg-gray-200 transition-colors duration-200"
        >
            <svg className="w-6 h-6" viewBox="0 0 48 48">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.42-4.55H24v8.51h12.8c-.57 2.76-2.26 5.14-4.64 6.7l7.98 6.19c4.63-4.28 7.29-10.45 7.29-17.95z"></path>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.82l-7.98-6.19c-2.13 1.43-4.87 2.27-7.91 2.27-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                <path fill="none" d="M0 0h48v48H0z"></path>
            </svg>
            Zaloguj się z Google
        </button>
    );
};

const AnalyticsSelector: React.FC<{
    accounts: GaAccount[];
    properties: GaProperty[];
    selectedAccount: string;
    onAccountChange: (val: string) => void;
    selectedProperty: string;
    onPropertyChange: (val: string) => void;
    disabled: boolean;
}> = ({ accounts, properties, selectedAccount, onAccountChange, selectedProperty, onPropertyChange, disabled }) => (
    <div className="w-full flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
            <label htmlFor="ga-account" className="block text-sm font-medium mb-1 text-brand-subtle">Krok 1: Wybierz konto</label>
            <select
                id="ga-account"
                value={selectedAccount}
                onChange={e => onAccountChange(e.target.value)}
                disabled={disabled || accounts.length === 0}
                className="w-full p-3 bg-brand-surface border-2 border-brand-secondary rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors duration-200 disabled:opacity-50"
            >
                <option value="">{accounts.length > 0 ? 'Wybierz konto...' : 'Ładowanie kont...'}</option>
                {accounts.map(acc => <option key={acc.name} value={acc.name}>{acc.displayName}</option>)}
            </select>
        </div>
        <div className="flex-1">
            <label htmlFor="ga-property" className="block text-sm font-medium mb-1 text-brand-subtle">Krok 2: Wybierz usługę GA4</label>
            <select
                id="ga-property"
                value={selectedProperty}
                onChange={e => onPropertyChange(e.target.value)}
                disabled={disabled || !selectedAccount || properties.length === 0}
                className="w-full p-3 bg-brand-surface border-2 border-brand-secondary rounded-lg focus:ring-2 focus:ring-brand-primary focus:border-brand-primary transition-colors duration-200 disabled:opacity-50"
            >
                <option value="">{selectedAccount ? (properties.length > 0 ? 'Wybierz usługę...' : 'Ładowanie usług...') : 'Najpierw wybierz konto'}</option>
                {properties.map(prop => <option key={prop.name} value={prop.name}>{prop.displayName}</option>)}
            </select>
        </div>
    </div>
);

const AnalysisOptions: React.FC<{ selectedType: AnalysisType; setSelectedType: (type: AnalysisType) => void; disabled: boolean;}> = ({ selectedType, setSelectedType, disabled }) => (
  <div className="w-full">
    <h3 className="flex items-center gap-2 text-lg font-semibold mb-3 text-brand-text">
      <LightBulbIcon className="w-6 h-6 text-brand-primary" />
      Krok 3: Wybierz rodzaj analizy
    </h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      {ANALYSIS_OPTIONS.map(({ id, label, icon: Icon }) => (
        <button
          key={id} type="button" onClick={() => setSelectedType(id)} disabled={disabled}
          className={`p-4 border-2 rounded-lg text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-start gap-3 h-full ${
            selectedType === id 
            ? 'bg-brand-primary/20 border-brand-primary ring-2 ring-brand-primary' 
            : 'bg-brand-surface border-brand-secondary hover:border-brand-primary/70'
          }`}
          aria-pressed={selectedType === id}
        >
          <Icon className="w-6 h-6 text-brand-primary flex-shrink-0 mt-1" />
          <span className="font-semibold">{label}</span>
        </button>
      ))}
    </div>
  </div>
);

const LoadingSpinner: React.FC = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" role="status" aria-label="Ładowanie">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const SubmitButton: React.FC<{ isLoading: boolean; disabled: boolean; onClick: () => void; }> = ({ isLoading, disabled, onClick }) => (
  <button
    type="button" onClick={onClick} disabled={disabled || isLoading}
    className="w-full flex justify-center items-center gap-2 text-lg font-bold bg-brand-primary text-white py-3 px-6 rounded-lg hover:bg-brand-primary-hover transition-colors duration-200 disabled:bg-brand-secondary disabled:cursor-not-allowed"
  >
    {isLoading ? ( <><LoadingSpinner /> Analizowanie...</> ) : ( <><SparklesIcon className="w-6 h-6" /> Rozpocznij Analizę</> )}
  </button>
);

const ResetButton: React.FC<{ onClick: () => void; }> = ({ onClick }) => (
    <button
      type="button" onClick={onClick}
      className="w-full flex justify-center items-center gap-2 text-lg font-bold bg-brand-secondary text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors duration-200"
    >
        <ArrowPathIcon className="w-6 h-6" /> Rozpocznij od nowa
    </button>
);


const ResultDisplay: React.FC<{ result: string; }> = ({ result }) => {
    const [isCopied, setIsCopied] = useState(false);
    const analysisHtml = useMemo(() => {
        if (!result || !window.marked) return '';
        return window.marked.parse(result);
    }, [result]);

    const handleCopy = useCallback(() => {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(result).then(() => {
                setIsCopied(true);
                setTimeout(() => setIsCopied(false), 2000);
            });
        }
    }, [result]);

    return (
        <div className="w-full mt-8" aria-live="polite">
            <div className="flex justify-between items-center mb-4">
                <h2 className="flex items-center gap-2 text-2xl font-bold text-brand-text">
                    <DocumentTextIcon className="w-8 h-8 text-brand-primary" /> Wyniki Analizy
                </h2>
                <button
                    type="button" onClick={handleCopy}
                    className={`flex items-center gap-2 py-2 px-3 rounded-lg text-sm transition-colors duration-200 ${isCopied ? 'bg-green-700 text-white' : 'bg-brand-secondary hover:bg-gray-600 text-brand-text'}`}
                    aria-label={isCopied ? 'Skopiowano do schowka' : 'Kopiuj do schowka'}
                >
                    {isCopied ? ( <><CheckIcon className="w-5 h-5" /> Skopiowano!</> ) : ( <><ClipboardIcon className="w-5 h-5" /> Kopiuj</> )}
                </button>
            </div>
            <div
                className="p-6 bg-brand-surface border-2 border-brand-secondary rounded-lg prose prose-invert max-w-none prose-p:text-brand-text prose-headings:text-brand-text prose-strong:text-brand-text prose-ul:text-brand-text prose-li:text-brand-text prose-li::marker:text-brand-primary"
                dangerouslySetInnerHTML={{ __html: analysisHtml }}
            />
        </div>
    );
};

const ErrorMessage: React.FC<{ message: string; }> = ({ message }) => (
  <div className="p-4 mt-6 w-full bg-red-900/50 border-2 border-red-500 text-red-300 rounded-lg" role="alert">
    <p className="font-bold">Wystąpił błąd lub wymagana jest konfiguracja</p>
    <p>{message}</p>
  </div>
);

const INITIAL_STATE = {
    analysisType: AnalysisType.GENERAL,
    isLoading: false,
    analysisResult: '',
    error: '',
    isAuthenticated: false,
    accessToken: '',
    accounts: [],
    properties: [],
    selectedAccount: '',
    selectedProperty: '',
};

export default function App() {
  const [authState, setAuthState] = useState({ isAuthenticated: INITIAL_STATE.isAuthenticated, accessToken: INITIAL_STATE.accessToken });
  const [gaState, setGaState] = useState({ accounts: INITIAL_STATE.accounts as GaAccount[], properties: INITIAL_STATE.properties as GaProperty[], selectedAccount: INITIAL_STATE.selectedAccount, selectedProperty: INITIAL_STATE.selectedProperty });
  const [analysisState, setAnalysisState] = useState({ analysisType: INITIAL_STATE.analysisType, isLoading: INITIAL_STATE.isLoading, analysisResult: INITIAL_STATE.analysisResult, error: INITIAL_STATE.error });

  const handleLoginSuccess = useCallback((tokenResponse: { access_token: string; }) => {
    setAuthState({ isAuthenticated: true, accessToken: tokenResponse.access_token });
  }, []);

  useEffect(() => {
    if (authState.isAuthenticated) {
      listAccounts(authState.accessToken)
        .then(accounts => setGaState(s => ({ ...s, accounts })))
        .catch(err => setAnalysisState(s => ({...s, error: `Nie udało się pobrać kont: ${err.message}` })));
    }
  }, [authState.isAuthenticated, authState.accessToken]);

  useEffect(() => {
    if (gaState.selectedAccount && authState.accessToken) {
        setGaState(s => ({...s, properties: [], selectedProperty: ''})); // Reset properties on account change
        listProperties(gaState.selectedAccount, authState.accessToken)
            .then(properties => setGaState(s => ({...s, properties })))
            .catch(err => setAnalysisState(s => ({...s, error: `Nie udało się pobrać usług: ${err.message}` })));
    }
  }, [gaState.selectedAccount, authState.accessToken]);

  const handleAnalyze = useCallback(async () => {
    if (!gaState.selectedProperty) {
      setAnalysisState(s => ({...s, error: 'Proszę wybrać usługę GA4 przed rozpoczęciem analizy.'}));
      return;
    }

    setAnalysisState(s => ({ ...s, isLoading: true, error: '', analysisResult: '' }));

    try {
      const reportData = await runReport(gaState.selectedProperty, authState.accessToken, analysisState.analysisType);
      const result = await analyzeGaData(reportData, analysisState.analysisType);
      setAnalysisState(s => ({ ...s, analysisResult: result, isLoading: false }));
    } catch (err) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : 'Wystąpił nieoczekiwany błąd.';
      setAnalysisState(s => ({ ...s, error: `Nie udało się przeprowadzić analizy. ${errorMessage}`, isLoading: false }));
    }
  }, [gaState.selectedProperty, authState.accessToken, analysisState.analysisType]);
  
  const handleReset = useCallback(() => {
      setAnalysisState({
          analysisType: INITIAL_STATE.analysisType,
          isLoading: INITIAL_STATE.isLoading,
          analysisResult: INITIAL_STATE.analysisResult,
          error: INITIAL_STATE.error,
      });
      // Do not reset login state or GA selections
  }, []);

  const isButtonDisabled = !gaState.selectedProperty;
  const showResults = analysisState.analysisResult || analysisState.error;

  return (
    <div className="min-h-screen bg-brand-background font-sans">
      <main className="container mx-auto px-4 py-8 md:py-12">
        <div className="max-w-4xl mx-auto flex flex-col items-center gap-8">
          <Header />
          <div className="w-full p-6 md:p-8 bg-black/20 border border-brand-secondary rounded-xl shadow-2xl flex flex-col gap-8">
              {!authState.isAuthenticated ? (
                <GoogleLoginButton onLoginSuccess={handleLoginSuccess} />
              ) : (
                <>
                    <AnalyticsSelector 
                        accounts={gaState.accounts}
                        properties={gaState.properties}
                        selectedAccount={gaState.selectedAccount}
                        onAccountChange={(val) => setGaState(s => ({...s, selectedAccount: val}))}
                        selectedProperty={gaState.selectedProperty}
                        onPropertyChange={(val) => setGaState(s => ({...s, selectedProperty: val}))}
                        disabled={analysisState.isLoading || !!showResults}
                    />
                    <AnalysisOptions selectedType={analysisState.analysisType} setSelectedType={(type) => setAnalysisState(s => ({...s, analysisType: type}))} disabled={analysisState.isLoading || !!showResults} />
                    
                    {showResults ? (
                        <ResetButton onClick={handleReset} />
                    ) : (
                        <SubmitButton isLoading={analysisState.isLoading} disabled={isButtonDisabled} onClick={handleAnalyze} />
                    )}
                </>
              )}
          </div>

          {analysisState.error && <ErrorMessage message={analysisState.error} />}
          {analysisState.isLoading && !analysisState.analysisResult && (
             <div className="text-center p-8" aria-live="polite">
                <LoadingSpinner />
                <p className="mt-4 text-lg text-brand-subtle">Pobieram dane z Google Analytics i przekazuję je AI... To może potrwać chwilę.</p>
            </div>
          )}
          {analysisState.analysisResult && <ResultDisplay result={analysisState.analysisResult} />}
        </div>
      </main>
      <footer className="text-center p-4 text-brand-subtle text-sm">
        <p>Powered by Google Gemini & Google Analytics API. Stworzone z pasją dla analityki.</p>
      </footer>
    </div>
  );
}
