import { BadRequestException } from '@nestjs/common';

export type PageRequest = { page: number; limit: number };
export type Paginated<T> = PageRequest & {
  data: T[];
  total: number;
  totalPages: number;
};

export function parsePageRequest(
  pageValue?: string,
  limitValue?: string,
  maximumLimit = 100,
): PageRequest {
  const page = pageValue === undefined ? 1 : Number(pageValue);
  const limit = limitValue === undefined ? 20 : Number(limitValue);

  if (!Number.isInteger(page) || page < 1) {
    throw new BadRequestException('page debe ser un entero mayor o igual a 1');
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > maximumLimit) {
    throw new BadRequestException(`limit debe estar entre 1 y ${maximumLimit}`);
  }
  return { page, limit };
}

export function pageResult<T>(
  data: T[],
  total: number,
  request: PageRequest,
): Paginated<T> {
  return {
    data,
    page: request.page,
    limit: request.limit,
    total,
    totalPages: total === 0 ? 0 : Math.ceil(total / request.limit),
  };
}
