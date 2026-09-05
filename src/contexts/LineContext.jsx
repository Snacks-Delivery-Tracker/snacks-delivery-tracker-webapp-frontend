import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from '../api/client';

const LineContext = createContext(null);

export function LineProvider({ children }) {
  const [line, setLine] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshLine = useCallback(async (lineId) => {
    setIsLoading(true);
    setError('');
    try {
      const baseLine = lineId ? { _id: lineId } : await api.getCurrentLine();
      if (!baseLine?._id) {
        setLine(null);
        return null;
      }
      const detailedLine = await api.getLine(baseLine._id);
      setLine(detailedLine);
      return detailedLine;
    } catch (requestError) {
      setError(requestError.message);
      setLine(null);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refreshLine(); }, [refreshLine]);

  return (
    <LineContext.Provider value={{ line, isLoading, error, refreshLine, setLine }}>
      {children}
    </LineContext.Provider>
  );
}

export function useLine() {
  const context = useContext(LineContext);
  if (!context) throw new Error('useLine must be used inside LineProvider');
  return context;
}
