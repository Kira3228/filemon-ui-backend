import { Request, Response, NextFunction } from 'express'

export function parseQueryArrays(fields: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    fields.forEach(field => {
      if (req.query[field]) {
        (req.query as any)[field] = Array.isArray(req.query[field])
          ? req.query[field]
          : [req.query[field]]
      }
    })
    next()
  }
}