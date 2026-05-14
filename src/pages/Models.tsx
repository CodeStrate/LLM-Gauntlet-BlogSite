import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link, useSearchParams } from "react-router-dom";
import { ModelCard, cardTitle, cardSubtext } from "../components/ModelCard";
import { models, type Model } from "../lib/models";

type Filter = "all" | "track-a" | "track-b" | "reap" | "benched";

const FILTERS: { id: Filter; label: string; blurb: string }[] = [
  { id: "all", label: "All", blurb: "Every contender" },
  { id: "track-a", label: "Track A", blurb: "Cold / prompted, non-thinking" },
  {
    id: "track-b",
    label: "Track B",
    blurb: "Reasoning models, model-card mode",
  },
  { id: "reap", label: "REAP", blurb: "Expert-pruned MoE models" },
  { id: "benched", label: "Benched", blurb: "Retired or DQ'd" },
];

const SMALL_THRESHOLD_B = 9; // params < 9B → small models grid

function paramSize(model: Model): number {
  return parseFloat(model.params ?? "0") || 0;
}

function isSmall(model: Model): boolean {
  const size = paramSize(model);
  return size > 0 && size < SMALL_THRESHOLD_B;
}

function isBenched(model: Model): boolean {
  return (
    model.status === "bench" ||
    model.status === "retired" ||
    model.track === "bench" ||
    model.track === "retired"
  );
}

export function Models() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Map URL ?track=A|B → filter id; default 'all'
  const initialFilter = useMemo<Filter>(() => {
    const t = searchParams.get("track");
    if (t === "A") return "track-a";
    if (t === "B") return "track-b";
    if (t === "reap") return "reap";
    if (t === "benched") return "benched";
    return "all";
  }, [searchParams]);

  const [filter, setFilter] = useState<Filter>(initialFilter);

  // Stay in sync if the user navigates here from a deep link
  useEffect(() => {
    setFilter(initialFilter);
  }, [initialFilter]);

  function changeFilter(next: Filter) {
    setFilter(next);
    const sp = new URLSearchParams(searchParams);
    if (next === "track-a") sp.set("track", "A");
    else if (next === "track-b") sp.set("track", "B");
    else if (next === "reap") sp.set("track", "reap");
    else if (next === "benched") sp.set("track", "benched");
    else sp.delete("track");
    setSearchParams(sp, { replace: true });
  }

  // Main grid: respect the filter, then drop the small models (they get their own section)
  const list = useMemo<Model[]>(() => {
    let pool = models.slice();
    if (filter === "track-a")
      pool = pool.filter((m) => m.track === "A" && !isBenched(m) && !m.reap);
    else if (filter === "track-b")
      pool = pool.filter((m) => m.track === "B" && !isBenched(m) && !m.reap);
    else if (filter === "reap") pool = pool.filter((m) => m.reap);
    else if (filter === "benched") pool = pool.filter(isBenched);
    else pool = pool.filter((m) => !isSmall(m)); // 'all' — exclude smalls only

    return pool.sort((a, b) => (b.averageScore ?? -1) - (a.averageScore ?? -1));
  }, [filter]);

  // Small models section — always shown on 'all', plus when filtering Track A/B if any small model lives there
  const smalls = useMemo<Model[]>(() => {
    const all = models.filter((m) => isSmall(m) && !m.reap);
    if (filter === "track-a") return all.filter((m) => m.track === "A");
    if (filter === "track-b") return all.filter((m) => m.track === "B");
    if (filter === "reap") return [];
    if (filter === "benched") return all.filter(isBenched);
    return all;
  }, [filter]);

  return (
    <div className="px-[clamp(20px,5vw,80px)] py-16 sm:py-20">
      <div className="flex items-baseline justify-between gap-8 mb-16 max-w-[1400px] mx-auto flex-wrap">
        <div className="inline-flex items-center font-mono text-sm font-semibold tracking-wide border border-[color:var(--color-ink)] rounded px-3 py-2">
          MODELS
        </div>
        <FilterBar filter={filter} onChange={changeFilter} />
      </div>

      {list.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 max-w-[1400px] mx-auto border-t border-[color:var(--color-ink)]">
          {list.map((model, i) => (
            <motion.div
              key={model.slug}
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
              className="border-b border-[color:var(--color-ink)] flex flex-col md:even:border-l md:even:border-[color:var(--color-ink)]"
            >
              <ModelCard model={model} extraLeftPad={i % 2 === 1} />
            </motion.div>
          ))}
        </div>
      )}

      {smalls.length > 0 && (
        <div className="max-w-[1400px] mx-auto mt-32 mb-8">
          <div className="flex items-baseline justify-between mb-10 flex-wrap gap-4">
            <h2 className="font-mono text-sm font-semibold tracking-wide uppercase border border-[color:var(--color-ink)] rounded px-3 py-2 inline-block">
              SMALL MODELS (&lt;9B)
            </h2>
            <p className="font-sans text-[14px] text-[color:var(--color-ink-soft)] max-w-md">
              Sub-9B contenders. Tested for completeness; structurally
              outclassed on the architectural tasks. REAP models shown
              separately.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-12 sm:gap-16 mt-8">
            {smalls.map((model, i) => {
              const subtext = cardSubtext(model);

              return (
                <motion.div
                  key={model.slug}
                  initial={{ y: 12, opacity: 0 }}
                  whileInView={{ y: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: Math.min(i * 0.03, 0.4) }}
                >
                  <Link
                    to={`/models/${model.slug}`}
                    className="group block p-10 sm:p-12 border border-[color:var(--color-rule)] rounded-xl hover:border-[color:var(--color-ink)] transition-colors h-full bg-[color:var(--color-bg)]"
                  >
                    <div className="flex flex-col gap-10 h-full justify-between">
                      <div className="flex items-start justify-between gap-4">
                        <h3 className="font-mono whitespace-pre-line font-semibold text-[15px] uppercase tracking-wide group-hover:underline leading-tight">
                          {cardTitle(model)}
                        </h3>
                        {model.averageScore !== undefined && (
                          <span className="font-headline text-2xl leading-none shrink-0">
                            {model.averageScore.toFixed(2)}
                          </span>
                        )}
                      </div>
                      {subtext && (
                        <div className="font-mono text-[11px] text-[color:var(--color-ink-soft)] uppercase tracking-widest pt-4 border-t border-[color:var(--color-rule-soft)]">
                          {subtext}
                        </div>
                      )}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {list.length === 0 && smalls.length === 0 && (
        <p className="font-mono text-sm text-[color:var(--color-ink-soft)] mt-16 text-center">
          No models in this filter.
        </p>
      )}
    </div>
  );
}

function FilterBar({
  filter,
  onChange,
}: {
  filter: Filter;
  onChange: (f: Filter) => void;
}) {
  return (
    <div className="flex flex-wrap gap-3">
      {FILTERS.map((f) => (
        <button
          key={f.id}
          onClick={() => onChange(f.id)}
          title={f.blurb}
          className={[
            "font-mono text-xs uppercase tracking-[0.1em] pb-1 transition-colors relative",
            filter === f.id
              ? 'text-[color:var(--color-ink)] after:content-[""] after:absolute after:left-0 after:right-0 after:bottom-0 after:h-px after:bg-[color:var(--color-ink)]'
              : "text-[color:var(--color-ink-soft)] hover:text-[color:var(--color-ink)]",
          ].join(" ")}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
