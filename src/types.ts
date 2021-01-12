export type Goal = (input: State) => Stream;
export type State = [Substitution, number];

export type Substitution = Association[];
export type Association = [number, Term];

export type Stream = | MatureStream;
export type MatureStream = | null | State[];

export type Var = number;
export type Symbol = string;
export type Bool = boolean;
export type Empty = [];
export type Pair = [Term, Term];

export type Term = Var | Bool | Symbol | Empty | Pair;
export type Maybe<T> = T | false;

