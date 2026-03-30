import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { riskApi } from '../lib/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await riskApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    {
      title: '风险登记台账',
      description: '管理企业风险清单',
      icon: '📋',
      path: '/risks',
      color: 'bg-blue-500',
    },
    {
      title: '风险矩阵',
      description: '可视化风险分布',
      icon: '📊',
      path: '/matrix',
      color: 'bg-green-500',
    },
    {
      title: 'KRI监控',
      description: '关键风险指标监控',
      icon: '📈',
      path: '/kri',
      color: 'bg-purple-500',
    },
    {
      title: '应急预案',
      description: '应急预案管理',
      icon: '🛡️',
      path: '/plans',
      color: 'bg-orange-500',
    },
    {
      title: '风险检查',
      description: '风险点检任务',
      icon: '✅',
      path: '/checks',
      color: 'bg-teal-500',
    },
    {
      title: '供应商管理',
      description: '供应商风险管理',
      icon: '🏭',
      path: '/suppliers',
      color: 'bg-pink-500',
    },
    {
      title: '培训管理',
      description: '培训计划与记录',
      icon: '📚',
      path: '/training',
      color: 'bg-indigo-500',
    },
    {
      title: '系统设置',
      description: '公司配置管理',
      icon: '⚙️',
      path: '/settings',
      color: 'bg-gray-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">
                企业风险管理系统
              </h1>
              {user?.company && (
                <span className="ml-4 text-sm text-gray-600">
                  {user.company.name}
                </span>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                欢迎，{user?.name || user?.email}
              </span>
              <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                退出
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              管理驾驶舱
            </h2>
            <p className="text-gray-600">
              全面了解企业风险状况，及时发现和应对各类风险
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      风险总数
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-gray-900">
                      {stats?.total || 0}
                    </dd>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      高风险
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-red-600">
                      {stats?.byLevel?.high || 0}
                    </dd>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      中等风险
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-yellow-600">
                      {stats?.byLevel?.medium || 0}
                    </dd>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      低风险
                    </dt>
                    <dd className="mt-1 text-3xl font-semibold text-green-600">
                      {stats?.byLevel?.low || 0}
                    </dd>
                  </div>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  快捷功能
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {menuItems.map((item) => (
                    <button
                      key={item.path}
                      onClick={() => navigate(item.path)}
                      className="bg-white overflow-hidden shadow rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div className="p-5">
                        <div className="flex items-center">
                          <div
                            className={`${item.color} flex-shrink-0 rounded-lg p-3`}
                          >
                            <span className="text-2xl">{item.icon}</span>
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="text-lg font-medium text-gray-900">
                              {item.title}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {item.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      风险等级分布
                    </h3>
                    <div className="space-y-4">
                      {Object.entries(stats?.byLevel || {}).map(
                        ([level, count]: [any, any]) => (
                          <div key={level}>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">
                                {level === 'low'
                                  ? '低风险'
                                  : level === 'medium'
                                  ? '中风险'
                                  : level === 'high'
                                  ? '高风险'
                                  : '极高风险'}
                              </span>
                              <span className="font-medium">{count} 个</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  level === 'low'
                                    ? 'bg-green-500'
                                    : level === 'medium'
                                    ? 'bg-yellow-500'
                                    : level === 'high'
                                    ? 'bg-red-500'
                                    : 'bg-red-700'
                                }`}
                                style={{
                                  width: `${
                                    ((count as number) / (stats?.total || 1)) *
                                    100
                                  }%`,
                                }}
                              ></div>
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">
                      风险状态分布
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">活动中</p>
                          <p className="text-2xl font-bold text-green-600">
                            {stats?.byStatus?.active || 0}
                          </p>
                        </div>
                        <div className="text-green-500 text-4xl">🟢</div>
                      </div>
                      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                        <div>
                          <p className="text-sm text-gray-600">已关闭</p>
                          <p className="text-2xl font-bold text-gray-600">
                            {stats?.byStatus?.closed || 0}
                          </p>
                        </div>
                        <div className="text-gray-500 text-4xl">⚪</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
