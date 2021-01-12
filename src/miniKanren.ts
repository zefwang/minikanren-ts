import _ from 'lodash';
import {Association, Goal, Maybe, Pair, State, Stream, Substitution, Term, Var} from "./types";

export function makeVar(n: number): number {
  return n
}
export function isVar(t: Term): t is number {
  return typeof t === 'number';
}

export function isPair(t: Term): t is Pair {
  return Array.isArray(t) && t.length===2;
}

export function isSymbol(t: Term): t is string {
  return typeof t === 'string'
}

export function assv(t: Term, sub: Substitution): Maybe<Association> {
  return _.find(sub, (asc: Association) => asc[0] === t) || false;
}

export function find(t: Term, sub: Substitution): Term {
  const found: Maybe<Association> = isVar(t) && assv(t, sub)
  if (found) {
    return find(found[1], sub);
  }
  return t;
}

export function occurs(v: Var, t: Term, s:Substitution): boolean {
  if (isVar(t)) {
    return v === t;
  } else if (isPair(t)) {
    return occurs(v, find(t[0], s), s) || occurs(v, find(t[1], s), s);
  } else {
    return false
  }
}

export function ext_s(v: Var, t: Term, s: Substitution): Maybe<Substitution> {
  if (occurs(v, t, s)) {
    return false;
  } else {
    return s.concat([[v, t]]);
  }
}

export function unify(t1: Term, t2: Term, sub: Substitution): Maybe<Substitution> {
  if (t1 === t2) return sub;
  else if (isVar(t1)) return ext_s(t1, t2, sub);
  else if (isVar(t2)) return ext_s(t2, t1, sub);
  else if (isPair(t1) && isPair(t2)) {
    const unifiedVars: Maybe<Substitution> = unify(find(t1[0], sub), find(t2[0], sub), sub);
    return unifiedVars && sub && unify(find(t1[1], unifiedVars), find(t2[1], unifiedVars), unifiedVars)
  } else {
    return false;
  }
}

export function equality(t1: Term, t2: Term): Goal {
  return (input: State): Stream => {
    const sub: Substitution = input[0];
    const newSub: Maybe<Substitution> = unify(find(t1, sub), find(t2, sub), sub);
    if(newSub) {
      return [[newSub, input[1]]];
    } else {
      return null;
    }
  };
}

export function call_fresh(goal_constructor: (new_var: Var) => Goal): Goal {
  return (input: State): Stream => {
    return goal_constructor(input[1])([input[0], input[1] + 1]);
  }
}

export function disj(g1: Goal, g2: Goal): Goal {
  return (input: State): Stream => {
    // @ts-ignore
    return [...g1(input), ...g2(input)];
  }
}

export function conj(g1: Goal, g2: Goal): Goal {
  return (input: State): Stream => {
    // @ts-ignore
    return g1(input).reduce((prev_stream: Stream, next_state: State): Stream => {
      // @ts-ignore
      return prev_stream.concat(g2(next_state))
    }, []);
  }
}
