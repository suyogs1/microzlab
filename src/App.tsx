import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary';
import { AppShell } from './components/AppShell';
import AsmDebugger from './components/AsmDebugger';
import Learn from './tabs/Learn';
import { Docs } from './tabs/Docs';
import DebuggerStandalone from './routes/DebuggerStandalone';
import { ToastContainer } from './components/ui/Toast';
import { DebuggerBusProvider } from './state/debuggerBus.tsx';
import { clearAllProgress } from './grader/asmGrader';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
}

type TabType = 'learn' | 'debug' | 'docs';

function App(): React.ReactElement {
  // Check if we're in standalone debugger route
  const isStandaloneRoute = window.location.pathname === '/debugger';
  
  if (isStandaloneRoute) {
    return (
      <ErrorBoundary>
        <div className="h-full bg-bg text-slate-200">
          <DebuggerStandalone />
        </div>
      </ErrorBoundary>
    );
  }

  const [activeTab, setActiveTab] = useState<TabType>('learn');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Clear all progress on app initialization
  useEffect(() => {
    clearAllProgress();
  }, []);

  // Handle navigation from debugger back to learn
  useEffect(() => {
    const handleNavigateToLearn = () => {
      setActiveTab('learn');
    };

    const handleNavigateToTab = (event: CustomEvent) => {
      const { tab } = event.detail || {};
      if (tab && ['learn', 'debug', 'docs'].includes(tab)) {
        setActiveTab(tab as TabType);
      }
    };

    window.addEventListener('navigate-to-learn', handleNavigateToLearn as EventListener);
    window.addEventListener('navigate-to-tab', handleNavigateToTab as EventListener);
    
    return () => {
      window.removeEventListener('navigate-to-learn', handleNavigateToLearn as EventListener);
      window.removeEventListener('navigate-to-tab', handleNavigateToTab as EventListener);
    };
  }, []);

  // Handle opening code in debugger from Learn tab
  const handleOpenInDebugger = (_code: string) => {
    setActiveTab('debug');
  };

  // Handle command palette actions
  const handleCommandAction = (action: string) => {
    switch (action) {
      case 'docs':
        setActiveTab('docs');
        break;
      case 'run':
      case 'step':
      case 'continue':
      case 'breakpoint':
      case 'goto':
      case 'follow-sp':
        // These would be handled by the debugger component
        break;
      default:
        console.log('Unknown command:', action);
    }
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const renderTabContent = (): React.ReactNode => {
    switch (activeTab) {
      case 'learn':
        return <Learn onOpenInDebugger={handleOpenInDebugger} />;
      case 'debug':
        return (
          <ErrorBoundary fallback={
            <div className="h-full flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="text-6xl">⚠️</div>
                <h3 className="text-lg font-medium text-slate-200">Debugger Error</h3>
                <p className="text-slate-400">The debugger encountered an error. Try refreshing the page.</p>
              </div>
            </div>
          }>
            <AsmDebugger />
          </ErrorBoundary>
        );
      case 'docs':
        return <Docs />;
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <DebuggerBusProvider>
        <Router>
          <Routes>
            <Route path="/debugger" element={<DebuggerStandalone />} />
            <Route path="*" element={
              <>
                <AppShell
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                  onCommandAction={handleCommandAction}
                >
                  {renderTabContent()}
                </AppShell>
                <ToastContainer toasts={toasts} onClose={removeToast} />
              </>
            } />
          </Routes>
        </Router>
      </DebuggerBusProvider>
    </ErrorBoundary>
  );
}

export default App;