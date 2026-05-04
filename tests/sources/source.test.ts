import "reflect-metadata";
import { FilesReadModel } from "../../src/read-models/files.read-model"

describe(`FilesReadModel`, () => {
  test(``, async () => {
    const qb = {
      leftJoin: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      getRawMany: jest.fn().mockResolvedValue([{ id: 1 }]),
    }

    const fileRepository = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
    } as any

    const filesReadModel = new FilesReadModel(fileRepository)

    const result = await filesReadModel.findRootFiles({ page: 1, limit: 10 })

    expect(fileRepository.createQueryBuilder).toHaveBeenCalledWith("f")
    expect(qb.limit).toHaveBeenCalledWith(10)
    expect(qb.offset).toHaveBeenCalledWith(0)
    expect(result).toEqual([{ id: 1 }])

  })

})