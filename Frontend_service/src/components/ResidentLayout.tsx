import { Outlet } from 'react-router-dom';
import { TabletAuthProvider } from '@/context/TabletAuthContext';

export function ResidentLayout() {
  return (
    <TabletAuthProvider>
      <Outlet />
    </TabletAuthProvider>
  );
}
