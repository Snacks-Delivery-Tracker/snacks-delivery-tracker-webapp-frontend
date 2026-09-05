import { BrowserRouter } from 'react-router-dom';
import { LineProvider } from './contexts/LineContext';
import { AppRoutes } from './routes/AppRoutes';

export default function App() {
  return <BrowserRouter><LineProvider><AppRoutes /></LineProvider></BrowserRouter>;
}
