import _ from "lodash";

// Types
type Var = number;
// @ts-ignore - Supress error with duplicate definition
type Symbol = string;
type Bool = boolean;
type Empty = [];
type Pair = [Term, Term]; // (cons term term)
type Term = Var | Symbol | Bool | Empty | Pair;

type Procedure = () => void;
type PullResult = [State, State[] | Procedure] | State[];

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
const unify = (t1: Term, t2: Term, sub: Substitution): Maybe<Substitution> => {
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

// Two terms -> Goal
const equality = (t1: Term, t2: Term): Goal => {
  return (input: State): State[] => {
    const sub: Substitution = input[0];
    const newSub: Maybe<Substitution> = unify(walk(t1, sub), walk(t2, sub), sub);

    if (newSub) {
      return [[newSub, input[1]]];
    } else {
      return [];
    }
  }
}

// Function f (eats variable) -> Goal
const callFresh = (f: (aVar: Var) => Goal): Goal => {
  return (input: State): State[] => {
    return f(input[1])([input[0], input[1]+1]);
  }
}

// Two goals -> Goal
const disjunction = (g1: Goal, g2: Goal): Goal => {
  return (input: State): State[] => {
    return [...g1(input), ...g2(input)] // Append two goals together
  }
}

const conjunction = (g1: Goal, g2: Goal): Goal => {
  return (input: State): State[] => {
    return g1(input).reduce((previousValue: State[], nextState: State): State[] => {
      return previousValue.concat(g2(nextState))
    }, []);
  }
}

/* Stuff I'm really unsure about */
const run = (n: number, g: Goal): Goal => {
  return (input: State): State[] => {
    return take(n, g([[], 0]))
  }
}

const take = (n: number, $: State[]): State[] => {
    if (n === 0) {
      return [];
    } else if ($.length === 0) {
      return [];
    } else if (n === 1) {
      return [pull($)[0]];
    } else {
      const p$: PullResult = pull($)
      // @ts-ignore - ignoring the type def for p$[1]
      return [p$[0], ...take(n-1, p$[1])];
    }
}

const pull = ($: State[]): PullResult => {
  if (typeof $ === 'function') {
    return pull($)
  } else {
    return $;
  }
}
