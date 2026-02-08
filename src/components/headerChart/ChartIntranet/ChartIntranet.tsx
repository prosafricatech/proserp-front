import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { data } from "../data";

function ChartIntranet() {
  return (
    <ResponsiveContainer width="100%" height={270}>
      <AreaChart data={data} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
        <XAxis dataKey="name" hide />
        <Tooltip labelStyle={{ color: "black" }} cursor={false} />
        <Area
          type="monotone"
          dataKey="expanse"
          stackId="1"
          stroke="#985EFF"
          fillOpacity={1}
          fill="#985EFF"
        />
        <Area
          type="monotone"
          dataKey="income"
          stackId="1"
          stroke="#BB86FC"
          fillOpacity={1}
          fill="#BB86FC"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export { ChartIntranet };
