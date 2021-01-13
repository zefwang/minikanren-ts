import _ from "lodash";

// Types
type Var = number;
// @ts-ignore - Supress error with duplicate definition
type Symbol = string;
type Bool = boolean;
type Empty = [];
type Pair = [Term, Term]; // (cons term term)
type Term = Var | Symbol | Bool | Empty | Pair;

// Goal is function that takes in state and returns List-of State
type Goal = (input: State) => State[];
type State = [Substitution, number];

type Substitution = Association[];
type Association = [Var, Term]; // (cons var term)

export type Maybe<T> = T | false; // (ex. Substitution | false is return for many functions)

/* Functions */

// Helper to determine if term is a var; need to specify return type to use "t" as var
const isVar = (t: Term): t is Var => {
  return typeof t === "number";
}

// Helper to determine if term is pair
const isPair = (t: Term): t is Pair => {
  return Array.isArray(t) && t.length === 2;
}

// Find first occurrence of the term in the substitution, otherwise return false
const assv = (t: Term, sub: Substitution): Maybe<Association> => {
  return _.find(sub, (ass:Association) => ass[0] == t) || false;
}

// Walk through to base term through all associations
const walk = (t: Term, sub: Substitution): Term => {
  const ass: Maybe<Association> = assv(t, sub);
  if (ass) {
    return walk(ass[1], sub);
  }
  return t;
}

// Checks if variable is present in the term with respect to the substitution
const occurs = (v: Var, t: Term, sub: Substitution): boolean => {
  if (isVar(t)) { // Term is a var
    return v === t;
  } else if (isPair(t)) { // Term is a pair
    return occurs(v, walk(t[0], sub), sub) || occurs(v, walk(t[1], sub), sub);
  } else {
    return false;
  }
}

// Adds (v, t) association to substitution unless v occurs in t already
const ext_s = (v: Var, t: Term, sub: Substitution): Maybe<Substitution> => {
  if (occurs(v, t, sub)) {
    return false;
  } else {
    return sub.concat([v, t])
  }
}

// Takes two terms and returns sustitution showing how to make terms equal
const unify = (t1: Term, t2: Term, sub: Substitution): Maybe<Substitution> {
  if (t1 === t2) {
    return sub;
  } else if (isVar(t1)) {
    return ext_s(t1, t2, sub);
  } else if (isVar(t2)) {
    return ext_s(t2, t1, sub);
  } else if (isPair(t1) && isPair(t2)) {
    const newSub: Maybe<Substitution> = unify(walk(t1[0], sub), walk(t2[0], sub), sub);
    return newSub && unify(walk(t1[1], newSub), walk(t2[1], newSub), newSub)
  } else {
    return false;
  }
}

// TODO: Equality, Call-Fresh, Conj, Disj
