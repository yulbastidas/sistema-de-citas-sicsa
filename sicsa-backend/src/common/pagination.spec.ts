import { BadRequestException } from '@nestjs/common';
import { pageResult, parsePageRequest } from './pagination';

describe('backend pagination contract', () => {
  it('uses safe defaults and calculates totals', () => {
    expect(parsePageRequest()).toEqual({ page: 1, limit: 20 });
    expect(pageResult(['item'], 41, { page: 2, limit: 20 })).toEqual({
      data: ['item'], page: 2, limit: 20, total: 41, totalPages: 3,
    });
  });

  it.each([
    ['0', '20'], ['1.5', '20'], ['1', '0'], ['1', '101'], ['x', '20'],
  ])('rejects invalid page/limit (%s, %s)', (page, limit) => {
    expect(() => parsePageRequest(page, limit)).toThrow(BadRequestException);
  });

  it('represents an empty page without inventing pages', () => {
    expect(pageResult([], 0, { page: 3, limit: 20 }).totalPages).toBe(0);
  });
});
