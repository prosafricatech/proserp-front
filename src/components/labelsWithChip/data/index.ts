export type LabelProps = {
  id: number;
  name?: string;
  slug?: string;
  color?: string;
};
export const labels: LabelProps[] = [
  { id: 1, name: "Banking", slug: "banking", color: "#E0CDFF" },
  { id: 2, name: "Company", slug: "company", color: "#00C4B4" },
  { id: 3, name: "Payments", slug: "payments", color: "#0F9AF7" },
];
