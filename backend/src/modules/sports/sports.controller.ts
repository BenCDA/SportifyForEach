import { Request, Response } from 'express';
import { SPORTS } from '../../constants/sports';
import { success } from '../../utils/response';

export function listSportsHandler(_req: Request, res: Response): void {
  res.json(success(SPORTS));
}
