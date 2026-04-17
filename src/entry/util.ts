import * as auth from "../utils/auth.ts";
import * as fn from "../utils/fn.ts";
import * as query from "../utils/query.ts";

export const util = {auth, fn, query} as const;
