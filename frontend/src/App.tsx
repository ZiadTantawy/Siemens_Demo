import React from 'react';
import ChatInterface from './components/chat/ChatInterface';
import { UIProvider } from './contexts/UIContext';
import { KnowledgeBaseProvider } from './contexts/KnowledgeBaseContext';
import { ChatProvider } from './contexts/ChatContext';

function App() {
  return (
    <UIProvider>
      <KnowledgeBaseProvider>
        <ChatProvider>
          <div className="min-h-screen bg-background">
            <ChatInterface />
          </div>
        </ChatProvider>
      </KnowledgeBaseProvider>
    </UIProvider>
  );
}

export default App;
