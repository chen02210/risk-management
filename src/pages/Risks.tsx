import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { riskApi } from '../lib/api';

export default function Risks() {
  const navigate = useNavigate();
  const [risks, setRisks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    riskNo: '',
    name: '',
    category: '安全环保',
    description: '',
    consequence: '',
    source: '',
    likelihood: 3,
    impact: 3,
    responseStrategy: '降低',
  });

  useEffect(() => {
    loadRisks();
  }, []);

  const loadRisks = async () => {
    try {
      const data = await riskApi.getAll();
      setRisks(data);
    } catch (error) {
      console.error('获取风险列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await riskApi.create(formData);
      setShowModal(false);
      setFormData({
        riskNo: '',
        name: '',
        category: '安全环保',
        description: '',
        consequence: '',
        source: '',
        likelihood: 3,
        impact: 3,
        responseStrategy: '降低',
      });
      loadRisks();
    } catch (error) {
      console.error('创建风险失败:', error);
      alert('创建失败');
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case '低':
        return 'bg-green-100 text-green-800';
      case '中':
        return 'bg-yellow-100 text-yellow-800';
      case '高':
        return 'bg-red-100 text-red-800';
      case '极高':
        return 'bg-red-700 text-white';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                风险登记台账
              </h1>
              <p className="mt-2 text-gray-600">
                管理和跟踪企业各类风险
              </p>
            </div>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              新增风险
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      风险编号
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      风险名称
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      类别
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      可能性
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      影响度
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      风险值
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      风险等级
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      状态
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      操作
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {risks.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-6 py-12 text-center text-gray-500"
                      >
                        暂无风险数据，点击"新增风险"开始添加
                      </td>
                    </tr>
                  ) : (
                    risks.map((risk) => (
                      <tr key={risk.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                          {risk.riskNo}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {risk.name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {risk.category}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {risk.likelihood}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {risk.impact}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {risk.likelihood * risk.impact}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRiskLevelColor(
                              risk.riskLevel
                            )}`}
                          >
                            {risk.riskLevel}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {risk.status === 'active' ? '活动中' : '已关闭'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          <button
                            onClick={() => navigate(`/risks/${risk.id}`)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            查看
                          </button>
                          <button
                            onClick={async () => {
                              if (confirm('确定要删除这个风险吗？')) {
                                await riskApi.delete(risk.id);
                                loadRisks();
                              }
                            }}
                            className="text-red-600 hover:text-red-900"
                          >
                            删除
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
              <h3 className="text-lg font-medium">新增风险</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    风险编号 *
                  </label>
                  <input
                    type="text"
                    value={formData.riskNo}
                    onChange={(e) =>
                      setFormData({ ...formData, riskNo: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="例如：S-01"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    风险类别 *
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="安全环保">安全环保</option>
                    <option value="生产运营">生产运营</option>
                    <option value="供应链">供应链</option>
                    <option value="财务">财务</option>
                    <option value="合规">合规</option>
                    <option value="信息">信息</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  风险名称 *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="请输入风险名称"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  风险描述
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="详细描述该风险"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  潜在后果
                </label>
                <textarea
                  value={formData.consequence}
                  onChange={(e) =>
                    setFormData({ ...formData, consequence: e.target.value })
                  }
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="该风险可能导致的损失或影响"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    可能性 (1-5) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.likelihood}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        likelihood: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    1=极低, 2=低, 3=中, 4=高, 5=极高
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    影响度 (1-5) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={formData.impact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        impact: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    1=轻微, 2=较小, 3=中等, 4=严重, 5=灾难性
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  应对策略
                </label>
                <select
                  value={formData.responseStrategy}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      responseStrategy: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="规避">规避</option>
                  <option value="降低">降低</option>
                  <option value="转移">转移</option>
                  <option value="接受">接受</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  创建风险
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
