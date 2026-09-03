/** Drop-in drifting aurora backdrop. Parent needs `relative overflow-hidden`. */
export default function Auroras({ dim = false }: { dim?: boolean }) {
  const o = dim ? "!opacity-20" : "!opacity-35";
  return (
    <div aria-hidden="true">
      <div className={`aurora aurora-1 -top-28 left-[6%] h-[340px] w-[380px] ${o}`} />
      <div className={`aurora aurora-2 -top-10 right-[8%] h-[300px] w-[420px] ${o}`} />
      <div className={`aurora aurora-3 top-[45%] left-[42%] h-[260px] w-[260px] ${dim ? "!opacity-15" : "!opacity-25"}`} />
    </div>
  );
}
