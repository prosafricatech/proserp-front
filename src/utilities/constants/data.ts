import { timeSince } from '../helpers';

export const time: string[] = [0.4, 0.5, 0.5, 0.6, 0.9].map((val) =>
  timeSince(val)
);

export let currentYear = new Date().getFullYear();
