import express, { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();

router.use(authMiddleware);

const calculateRiskLevel = (value: number): string => {
  if (value <= 4) return '低';
  if (value <= 9) return '中';
  if (value <= 16) return '高';
  return '极高';
};

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { category, status, level } = req.query;
    const companyId = req.user?.companyId;

    const where: any = {};
    if (companyId) where.companyId = companyId;
    if (category) where.category = category;
    if (status) where.status = status;
    if (level) where.riskLevel = level;

    const risks = await prisma.risk.findMany({
      where,
      include: {
        dept: true,
        owner: true,
        measures: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(risks);
  } catch (error) {
    console.error('获取风险列表失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const risk = await prisma.risk.findFirst({
      where: {
        id,
        companyId,
      },
      include: {
        dept: true,
        owner: true,
        measures: {
          include: {
            dept: true,
            owner: true,
          },
        },
      },
    });

    if (!risk) {
      return res.status(404).json({ error: '风险不存在' });
    }

    res.json(risk);
  } catch (error) {
    console.error('获取风险详情失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;
    if (!companyId) {
      return res.status(400).json({ error: '需要公司ID' });
    }

    const {
      riskNo,
      name,
      category,
      description,
      consequence,
      source,
      likelihood,
      impact,
      responseStrategy,
      deptId,
      ownerId,
      lastEvaluateAt,
      nextEvaluateAt,
    } = req.body;

    const riskValue = likelihood * impact;
    const riskLevel = calculateRiskLevel(riskValue);

    const risk = await prisma.risk.create({
      data: {
        riskNo,
        name,
        category,
        description,
        consequence,
        source,
        likelihood,
        impact,
        riskValue,
        riskLevel,
        responseStrategy,
        status: 'active',
        deptId,
        ownerId,
        lastEvaluateAt: lastEvaluateAt ? new Date(lastEvaluateAt) : null,
        nextEvaluateAt: nextEvaluateAt ? new Date(nextEvaluateAt) : null,
        companyId,
      },
      include: {
        dept: true,
        owner: true,
      },
    });

    res.status(201).json(risk);
  } catch (error) {
    console.error('创建风险失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const {
      name,
      category,
      description,
      consequence,
      source,
      likelihood,
      impact,
      responseStrategy,
      status,
      deptId,
      ownerId,
      lastEvaluateAt,
      nextEvaluateAt,
      residualRiskValue,
      residualRiskLevel,
    } = req.body;

    const riskValue = likelihood * impact;
    const riskLevel = calculateRiskLevel(riskValue);

    const risk = await prisma.risk.updateMany({
      where: {
        id,
        companyId,
      },
      data: {
        name,
        category,
        description,
        consequence,
        source,
        likelihood,
        impact,
        riskValue,
        riskLevel,
        responseStrategy,
        status,
        deptId,
        ownerId,
        lastEvaluateAt: lastEvaluateAt ? new Date(lastEvaluateAt) : undefined,
        nextEvaluateAt: nextEvaluateAt ? new Date(nextEvaluateAt) : undefined,
        residualRiskValue,
        residualRiskLevel,
      },
    });

    if (risk.count === 0) {
      return res.status(404).json({ error: '风险不存在' });
    }

    const updatedRisk = await prisma.risk.findUnique({
      where: { id },
      include: {
        dept: true,
        owner: true,
      },
    });

    res.json(updatedRisk);
  } catch (error) {
    console.error('更新风险失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const companyId = req.user?.companyId;

    const risk = await prisma.risk.deleteMany({
      where: {
        id,
        companyId,
      },
    });

    if (risk.count === 0) {
      return res.status(404).json({ error: '风险不存在' });
    }

    res.json({ message: '风险删除成功' });
  } catch (error) {
    console.error('删除风险失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

router.get('/stats/overview', async (req: AuthRequest, res: Response) => {
  try {
    const companyId = req.user?.companyId;

    const [total, low, medium, high, critical, active, closed] = await Promise.all([
      prisma.risk.count({ where: { companyId } }),
      prisma.risk.count({ where: { companyId, riskLevel: '低' } }),
      prisma.risk.count({ where: { companyId, riskLevel: '中' } }),
      prisma.risk.count({ where: { companyId, riskLevel: '高' } }),
      prisma.risk.count({ where: { companyId, riskLevel: '极高' } }),
      prisma.risk.count({ where: { companyId, status: 'active' } }),
      prisma.risk.count({ where: { companyId, status: 'closed' } }),
    ]);

    res.json({
      total,
      byLevel: { low, medium, high, critical },
      byStatus: { active, closed },
    });
  } catch (error) {
    console.error('获取风险统计失败:', error);
    res.status(500).json({ error: '服务器错误' });
  }
});

export default router;
