import React from 'react';
import VideoStreamer from '@/components/kitchen/VideoStreamer';
import { StaffHeader } from '@/components/staff/StaffHeader';

const KitchenMonitoringPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <StaffHeader />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Kitchen Monitoring</h1>
          <p className="text-gray-600">Monitor kitchen activities and dish preparation in real-time</p>
        </div>
        
        <VideoStreamer />
      </div>
    </div>
  );
};

export default KitchenMonitoringPage;
