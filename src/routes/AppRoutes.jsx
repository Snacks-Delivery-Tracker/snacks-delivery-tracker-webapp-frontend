import { Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { BillPreviewPage } from '../pages/BillPreviewPage';
import { DeliveryDetailsPage } from '../pages/DeliveryDetailsPage';
import { DeliveryFormPage } from '../pages/DeliveryFormPage';
import { EntryModePage } from '../pages/EntryModePage';
import { HistoricalLinePage } from '../pages/HistoricalLinePage';
import { HomePage } from '../pages/HomePage';
import { LinePage } from '../pages/LinePage';
import { LineBillPreviewPage } from '../pages/LineBillPreviewPage';
import { NewShopPage } from '../pages/NewShopPage';
import { PreviousLinesPage } from '../pages/PreviousLinesPage';
import { ReportPreviewPage } from '../pages/ReportPreviewPage';
import { ShopDetailsPage } from '../pages/ShopDetailsPage';
import { ShopPickerPage } from '../pages/ShopPickerPage';
import { LineAddShopPage } from '../pages/LineAddShopPage';
import { SnackPickerPage } from '../pages/SnackPickerPage';
import { NewSnackPage } from '../pages/NewSnackPage';

export function AppRoutes() {
  return <Routes><Route element={<AppShell />}><Route index element={<HomePage />} /><Route path="line" element={<LinePage />} /><Route path="line/add-shop" element={<LineAddShopPage />} /><Route path="shops" element={<ShopPickerPage />} /><Route path="shops/new" element={<NewShopPage />} /><Route path="shops/:shopId/details" element={<ShopDetailsPage />} /><Route path="snacks" element={<SnackPickerPage />} /><Route path="snacks/new" element={<NewSnackPage />} /><Route path="snacks/:snackId/edit" element={<NewSnackPage editing />} /><Route path="entry-mode/:shopId" element={<EntryModePage />} /><Route path="delivery/new/:shopId" element={<DeliveryFormPage />} /><Route path="deliveries/:orderId" element={<DeliveryDetailsPage />} /><Route path="deliveries/:orderId/edit" element={<DeliveryFormPage editing />} /><Route path="deliveries/:orderId/bill" element={<BillPreviewPage />} /><Route path="report" element={<ReportPreviewPage />} /><Route path="previous-lines" element={<PreviousLinesPage />} /><Route path="lines/:lineId/bill" element={<LineBillPreviewPage />} /><Route path="lines/:lineId" element={<HistoricalLinePage />} /></Route></Routes>;
}
