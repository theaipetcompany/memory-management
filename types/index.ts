import { type ReactNode } from 'react';

export type LayoutProps = {
  children: ReactNode;
};

export type DynamicRouteParams = Record<string, string | string[]>;

export type PageProps<T = DynamicRouteParams> = {
  params: T;
};

export type Maybe<T> = NonNullable<T> | undefined;

export type UnknowData = Record<string, unknown>;

export enum HttpMethod {
  CONNECT = 'CONNECT',
  DELETE = 'DELETE',
  GET = 'GET',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
  PATCH = 'PATCH',
  POST = 'POST',
  PUT = 'PUT',
  TRACE = 'TRACE',
}
