'use client';

import Image from "next/image";
import Link from "next/link";
import { Input, Button } from 'antd';
import { SearchOutlined, CopyOutlined } from '@ant-design/icons';
import { useHeaderStore } from '@/app/stores/headerStore';

export function Header() {
  const {
    deviceId,
    machineId,
    loading,
    setDeviceId,
    searchMachineId,
    copyMachineId
  } = useHeaderStore();

  const handleSearch = () => {
    searchMachineId(deviceId);
  };

  const handleCopy = () => {
    copyMachineId();
  };

  return (
    <header>
      <div className="bg-black/90 text-amber-50">
        {/* 导航栏 */}
        <div className="flex justify-center items-center py-2">
          <Link href="/">
            <Image
              src="/logo.png"
              alt="logo"
              width={150}
              height={100}
              className="cursor-pointer"
            />
          </Link>
          <Link
            href="/machine/staking"
            className="ml-20 text-2xl text-gray-400 hover:text-gray-300 active:text-white focus:text-gray-300 transition-colors outline-none"
          >
            质押机器列表
          </Link>

          <Link
            href="/machine/offline"
            className="ml-20 text-2xl text-gray-400 hover:text-gray-300 active:text-white focus:text-gray-300 transition-colors outline-none"
          >
            离线机器列表(未被租用时下线)
          </Link>
        </div>
        
        {/* 查询框 */}
        <div className="flex justify-center items-center py-4 border-t border-gray-700">
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">设备ID {'->'} 机器ID:</span>
            <Input
              placeholder="请输入设备ID"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              onPressEnter={handleSearch}
              style={{ width: 200 }}
              disabled={loading}
            />
            <Button
              type="primary"
              icon={<SearchOutlined />}
              onClick={handleSearch}
              loading={loading}
            >
              查询
            </Button>
            {machineId && (
               <div className="flex items-center space-x-2">
                 <span className="text-gray-300">机器ID:</span>
                 <div 
                   className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 flex items-center space-x-2 cursor-pointer hover:bg-gray-700 transition-colors"
                   onClick={handleCopy}
                   title="点击复制机器ID"
                 >
                   <span className="text-gray-200 font-mono text-sm select-none">
                     {machineId}
                   </span>
                   <CopyOutlined className="text-gray-400 hover:text-gray-200" />
                 </div>
               </div>
             )}
          </div>
        </div>
      </div>
    </header>
  );
}
