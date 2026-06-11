/**
 * Faithful port of Django's `django.core.paginator` (Paginator + Page).
 *
 * Same semantics as Django:
 *  - pages are 1-based
 *  - `orphans` folds a small final page into the previous one
 *  - `start_index` / `end_index` are 1-based positions in the full list
 *  - invalid pages raise PageNotAnInteger / EmptyPage (both extend InvalidPage)
 *
 * Works on any in-memory array (Django's "object_list"). For DB-backed
 * pagination, see `paginateResponse` at the bottom which produces the
 * DRF-style { count, next, previous, results } shape this app already uses.
 */

import { PaginationResponse } from "@/lib/config";

export class InvalidPage extends Error {}
export class PageNotAnInteger extends InvalidPage {}
export class EmptyPage extends InvalidPage {}

type PaginatorOptions = {
    orphans?: number;
    allowEmptyFirstPage?: boolean;
};

export class Paginator<T> {
    readonly objectList: readonly T[];
    readonly perPage: number;
    readonly orphans: number;
    readonly allowEmptyFirstPage: boolean;

    constructor(objectList: readonly T[], perPage: number, options: PaginatorOptions = {}) {
        const { orphans = 0, allowEmptyFirstPage = true } = options;
        this.objectList = objectList;
        // Django coerces per_page / orphans through int()
        this.perPage = Math.trunc(perPage);
        this.orphans = Math.trunc(orphans);
        this.allowEmptyFirstPage = allowEmptyFirstPage;
    }

    /** Total number of objects, across all pages. (Django: Paginator.count) */
    get count(): number {
        return this.objectList.length;
    }

    /** Total number of pages. (Django: Paginator.num_pages) */
    get numPages(): number {
        if (this.count === 0 && !this.allowEmptyFirstPage) {
            return 0;
        }
        const hits = Math.max(1, this.count - this.orphans);
        return Math.ceil(hits / this.perPage);
    }

    /** 1-based list of page numbers. (Django: Paginator.page_range) */
    get pageRange(): number[] {
        return Array.from({ length: this.numPages }, (_, i) => i + 1);
    }

    /**
     * Validate a page number the same way Django does, returning the int.
     * Throws PageNotAnInteger or EmptyPage on bad input.
     */
    validateNumber(number: number | string): number {
        let n: number;
        if (typeof number === "number") {
            if (!Number.isInteger(number)) {
                throw new PageNotAnInteger("That page number is not an integer");
            }
            n = number;
        } else {
            n = Number.parseInt(number, 10);
            if (Number.isNaN(n)) {
                throw new PageNotAnInteger("That page number is not an integer");
            }
        }
        if (n < 1) {
            throw new EmptyPage("That page number is less than 1");
        }
        if (n > this.numPages) {
            if (!(n === 1 && this.allowEmptyFirstPage)) {
                throw new EmptyPage("That page contains no results");
            }
        }
        return n;
    }

    /** Return a Page for the given 1-based page number. (Django: Paginator.page) */
    page(number: number | string): Page<T> {
        const n = this.validateNumber(number);
        const bottom = (n - 1) * this.perPage;
        let top = bottom + this.perPage;
        // Fold orphans into the last page.
        if (top + this.orphans >= this.count) {
            top = this.count;
        }
        return new Page(this.objectList.slice(bottom, top), n, this);
    }
}

export class Page<T> {
    constructor(
        readonly objectList: readonly T[],
        readonly number: number,
        readonly paginator: Paginator<T>,
    ) {}

    /** Items on this page. */
    get length(): number {
        return this.objectList.length;
    }

    hasNext(): boolean {
        return this.number < this.paginator.numPages;
    }

    hasPrevious(): boolean {
        return this.number > 1;
    }

    hasOtherPages(): boolean {
        return this.hasPrevious() || this.hasNext();
    }

    nextPageNumber(): number {
        return this.paginator.validateNumber(this.number + 1);
    }

    previousPageNumber(): number {
        return this.paginator.validateNumber(this.number - 1);
    }

    /** 1-based index of the first object on this page, within the full list. */
    startIndex(): number {
        if (this.paginator.count === 0) {
            return 0;
        }
        return this.paginator.perPage * (this.number - 1) + 1;
    }

    /** 1-based index of the last object on this page, within the full list. */
    endIndex(): number {
        if (this.number === this.paginator.numPages) {
            return this.paginator.count;
        }
        return this.number * this.paginator.perPage;
    }
}

/**
 * Convenience wrapper: paginate an in-memory array, Django-style.
 *   const page = paginate(threads, requestedPage, 10);
 */
export function paginate<T>(
    objectList: readonly T[],
    number: number | string,
    perPage: number,
    options: PaginatorOptions = {},
): Page<T> {
    return new Paginator(objectList, perPage, options).page(number);
}

/**
 * Turn a Page into the DRF `PageNumberPagination` response shape
 * ({ count, next, previous, results }) that this app already speaks.
 * `url` is the request path; next/previous become `${url}?page=N` (or null).
 */
export function paginateResponse<T>(page: Page<T>, url: string): PaginationResponse {
    const buildLink = (pageNumber: number) => `${url}?page=${pageNumber}`;
    return {
        count: page.paginator.count,
        next: page.hasNext() ? buildLink(page.number + 1) : null,
        previous: page.hasPrevious() ? buildLink(page.number - 1) : null,
        results: page.objectList as unknown as object[],
    };
}
