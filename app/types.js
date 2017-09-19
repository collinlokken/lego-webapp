// @flow

import type { Store as ReduxStore, Reducer as ReduxReducer } from 'redux';
import type { Reducers } from 'app/reducers';

export type AsyncActionType = {
  BEGIN: string,
  SUCCESS: string,
  FAILURE: string
};

export type EntityID = number;

export type ArticleEntity = {
  id: EntityID,
  title: string,
  content: string,
  tags: Array<string>,
  cover: string,
  description: string
};

export type Action = {
  type: string,
  payload?: any,
  meta?: any,
  error?: boolean
};

export type GalleryPictureEntity = {
  description?: string,
  active: boolean,
  file: string,
  galleryId: number,
  taggees?: Array<Object>
};

export type GalleryEntity = {
  title: string,
  description?: string,
  location?: string,
  takenAt?: Date,
  photographers?: EntityID[],
  event?: EntityID
};

type $ExtractFunctionReturn = <V>(v: (...args: any) => V) => V;

export type State = $ObjMap<Reducers, $ExtractFunctionReturn>;

export type Store = ReduxStore<State, Action>;

export type GetState = () => State;

export type Reducer<S, A> = ReduxReducer<S, A>;
export type Thunk<R> = (
  dispatch: Dispatch<State, any>,
  getState: () => State
) => R;
export type PromiseAction<R> = { type: string, payload: Promise<R> };
type ThunkDispatch<S> = <R>(action: Thunk<S, R>) => R;
type PromiseDispatch = <R>(action: PromiseAction<R>) => Promise<R>;
type PlainDispatch<A: { type: $Subtype<string> }> = (action: A) => A;
type Dispatch<S, A> = PlainDispatch<A> & ThunkDispatch<S> & PromiseDispatch;
