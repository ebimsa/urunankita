export default function handler(req, res) {
  res.status(200).json({
    status: 'ok',
    message: 'Pong from Vercel Serverless Function!',
    hasDbUrl: Boolean(process.env.DATABASE_URL),
    hasJwtSecret: Boolean(process.env.JWT_SECRET),
    availableEnvKeys: Object.keys(process.env).filter(k => !k.toLowerCase().includes('secret') && !k.toLowerCase().includes('pass')),
  });
}
