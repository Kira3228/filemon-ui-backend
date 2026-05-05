"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const files_read_model_1 = require("../../src/read-models/files.read-model");
describe(`FilesReadModel`, () => {
    test(``, () => __awaiter(void 0, void 0, void 0, function* () {
        const qb = {
            leftJoin: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            orderBy: jest.fn().mockReturnThis(),
            addOrderBy: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            offset: jest.fn().mockReturnThis(),
            getRawMany: jest.fn().mockResolvedValue([{ id: 1 }]),
        };
        const fileRepository = {
            createQueryBuilder: jest.fn().mockReturnValue(qb),
        };
        const filesReadModel = new files_read_model_1.FilesReadModel(fileRepository);
        const result = yield filesReadModel.findRootFiles({ page: 1, limit: 10 });
        expect(fileRepository.createQueryBuilder).toHaveBeenCalledWith("f");
        expect(qb.limit).toHaveBeenCalledWith(10);
        expect(qb.offset).toHaveBeenCalledWith(0);
        expect(result).toEqual([{ id: 1 }]);
    }));
});
