import { Router } from 'express';
import prisma from '../database/client';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Listar todos os usuários (apenas id, nome, email, criadoEm)
router.get('/', authenticateToken, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, createdAt: true }
        });
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro ao buscar usuários.' });
    }
});

export default router;
