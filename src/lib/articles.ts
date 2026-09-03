export type Article = {
  slug: string;
  title: string;
  teaser: string;
  minutes: number;
  level: "Beginner" | "Intermediate" | "Advanced";
  sections: { heading?: string; paragraphs: string[]; bullets?: string[] }[];
};

export const ARTICLES: Article[] = [
  {
    slug: "what-is-copy-trading",
    title: "What is copy trading? The complete beginner's guide",
    teaser: "How copying works mechanically, how it differs from mirror trading and social trading, and what actually happens in your account when a trader you follow opens a position.",
    minutes: 8,
    level: "Beginner",
    sections: [
      {
        paragraphs: [
          "Copy trading lets you automatically replicate the trading activity of another investor in your own account. You choose a trader, decide how much money to allocate to following them, and from that point every position they open or close is reproduced in your account — proportionally scaled to your allocation, without you lifting a finger.",
          "The key word is proportionally. Suppose you allocate $1,000 to copy a trader whose own portfolio is worth $100,000. If they invest $5,000 (5% of their portfolio) in a stock, your account invests 5% of your allocation — $50 — in the same stock at effectively the same moment. When they sell, you sell. Their percentage returns become your percentage returns, minus fees.",
        ],
      },
      {
        heading: "Copy trading vs. social trading vs. mirror trading",
        paragraphs: [
          "These three terms are often mixed up, but they describe different levels of automation. Social trading is the broadest: platforms where traders share ideas, positions and commentary, and you decide manually what to act on. Mirror trading is the oldest form: you subscribe to a strategy (often algorithmic) and your account executes its signals rigidly.",
          "Copy trading sits in the sweet spot: you follow a real person's live decisions with full automation, but you retain control — you can pause, exit, cap losses, or adjust your allocation at any time. On Mirrova, copying is always tied to a specific human strategist with a verified public record.",
        ],
      },
      {
        heading: "What happens in your account, step by step",
        paragraphs: ["Here's the exact lifecycle of a copy relationship on a modern platform:"],
        bullets: [
          "You allocate an amount — say $1,000 — to copy a trader. The money stays in your account; it is earmarked, not transferred.",
          "The platform reads each trade the trader makes and calculates its size as a fraction of their portfolio.",
          "The same fraction of your allocation is executed in your account, typically within milliseconds, using fractional units where necessary.",
          "Profits and losses accrue in your account in real time. The trader never touches your money.",
          "You exit whenever you choose: pause new trades, close single positions, or liquidate the whole relationship at market.",
        ],
      },
      {
        heading: "Why people copy trade",
        paragraphs: [
          "Most people don't have the time, temperament, or training to trade well. Markets punish inconsistency, and research repeatedly shows that retail traders who trade actively on their own underperform — driven by overtrading, poor risk-sizing and emotional exits. Copy trading outsources the decision-making to someone with a demonstrated process while keeping you in control of the risk envelope.",
          "It is not a shortcut to guaranteed profit. You take on the strategy's full market risk, and a trader's history — however impressive — cannot promise their future. Treat copy trading as what it is: a way to access skill and discipline, with risk you must still size responsibly.",
        ],
      },
    ],
  },
  {
    slug: "choosing-a-trader",
    title: "How to choose a trader worth copying",
    teaser: "Return numbers are the least important thing on a trader's profile. Here's what professional allocators look at instead — drawdown, consistency, process, and risk-adjusted return.",
    minutes: 10,
    level: "Beginner",
    sections: [
      {
        paragraphs: [
          "The biggest mistake new copiers make is sorting the leaderboard by 12-month return and copying the top name. High headline returns often come from high risk — and high risk eventually produces the drawdown that erases the headline. Professional allocators evaluate managers on a very different checklist. You should use the same one.",
        ],
      },
      {
        heading: "1. Maximum drawdown: the number that predicts your pain",
        paragraphs: [
          "Max drawdown is the largest peak-to-trough fall in the trader's history. It answers the question: if I had copied at the worst possible moment, how much would I have been down? A trader making +60% a year with a −45% max drawdown is not conservative — you would have needed nerves of steel (and most copiers bail at the bottom, converting a temporary drawdown into a permanent loss).",
          "Rule of thumb: only copy a trader whose historical max drawdown you could genuinely sit through without panic. If seeing your $5,000 become $3,500 would make you exit, don't copy anyone with a 30% drawdown history.",
        ],
      },
      {
        heading: "2. Consistency beats magnitude",
        paragraphs: [
          "Look at the monthly returns table, not the total. A trader with 20 profitable months out of 24, averaging +1.5%, is usually a far better copy than one with three +30% months and a lot of red. Consistency indicates a repeatable process; lumpy returns often indicate luck, concentration, or leverage.",
          "The Sharpe ratio compresses this into one number — return per unit of volatility. Above 1.5 is genuinely good. Above 2.5 over a multi-year record is exceptional.",
        ],
      },
      {
        heading: "3. Read the process, not just the numbers",
        paragraphs: [
          "A trader worth copying can explain what they do in two sentences, and their history should look like that explanation. If the bio says 'conservative dividend investing' but the trade log shows leveraged oil futures, walk away. On Mirrova, strategy drift is grounds for suspension — but your own reading is the first filter.",
        ],
        bullets: [
          "Does the stated strategy match the actual instruments traded?",
          "Is the win rate consistent with the style? (Trend followers win 40–50% with big winners; mean-reverters win 70%+ with small ones.)",
          "How long is the track record? Twelve months is a minimum; a record spanning at least one rough market period is worth far more.",
          "How do they behave in losing months — do position sizes shrink (discipline) or grow (revenge trading)?",
        ],
      },
      {
        heading: "4. Diversify across traders",
        paragraphs: [
          "Never put your whole allocation behind one person. Copy three to five traders with genuinely different strategies and markets — for example a conservative equity compounder, an FX trend follower, and a multi-asset macro book. Their bad weeks won't line up, which smooths your overall curve more than any single 'best' trader could.",
        ],
      },
    ],
  },
  {
    slug: "risk-management",
    title: "Risk management for copiers: the complete playbook",
    teaser: "Position sizing, copy stop-losses, diversification math, and the psychology of drawdowns — everything you need to survive long enough to compound.",
    minutes: 12,
    level: "Intermediate",
    sections: [
      {
        paragraphs: [
          "Copy trading transfers trade selection to someone else, but risk management stays entirely yours. The copier's edge is not picking trades — it's constructing and defending a portfolio of traders. This playbook covers the four controls that matter.",
        ],
      },
      {
        heading: "1. Size the total honestly",
        paragraphs: [
          "Before allocating anything, decide what fraction of your investable wealth belongs in copy trading at all. For most people this is a satellite allocation — commonly 5–20% of a portfolio whose core is boring diversified assets. Whatever your number, it must be money whose total loss would not change your life. Leverage-based strategies can and do lose fast.",
        ],
      },
      {
        heading: "2. Use the copy stop-loss as a circuit breaker",
        paragraphs: [
          "A copy stop-loss automatically liquidates a copy relationship when it falls a set percentage below your allocation. Set it just below the trader's historical max drawdown — tight enough to cap disaster, loose enough that normal volatility doesn't stop you out of a good strategy at the worst moment.",
          "Example: a trader's max drawdown is 18%. A stop at 25% means you'll survive anything resembling their history, but a genuine strategy failure can only cost you a quarter of the allocation. A stop at 10% would likely trigger during a routine month and convert noise into a realized loss.",
        ],
      },
      {
        heading: "3. Do the diversification math",
        paragraphs: [
          "Splitting $10,000 across five uncorrelated traders with 20% individual max drawdowns produces a portfolio whose realistic worst case is far shallower than 20% — their drawdowns don't synchronize. Splitting it across five crypto momentum traders produces one big correlated bet wearing five hats.",
        ],
        bullets: [
          "Mix markets: equities, FX, commodities, crypto respond to different drivers.",
          "Mix styles: trend following and mean reversion are natural complements.",
          "Mix time horizons: a scalper and a position trader rarely draw down together.",
          "Watch overlap: five traders all long the same three tech stocks are one trade.",
        ],
      },
      {
        heading: "4. Manage yourself",
        paragraphs: [
          "The data on copier behaviour is unambiguous: the most common way to lose money copying a good trader is to join after a hot streak and quit in a drawdown — buying their high, selling their low. Decide your rules before allocating: how long you'll evaluate (give any strategy at least a quarter), what would make you exit early (strategy drift, risk-score jump — not a red month), and when you'll add (on your schedule, not after wins).",
          "Review monthly, not hourly. A copy relationship checked every ten minutes will get interfered with; interference is where returns go to die.",
        ],
      },
    ],
  },
  {
    slug: "understanding-fees",
    title: "Copy trading fees, explained with real math",
    teaser: "Performance fees, high-water marks, spreads and the fee traps to avoid — with a worked example showing exactly what you'd pay on a winning and a losing year.",
    minutes: 7,
    level: "Beginner",
    sections: [
      {
        paragraphs: [
          "Fee structures decide whether a platform's incentives point the same direction as yours. The model to look for: no charge for assets sitting in your account, and traders paid only from profits they create. Here's how each component works, and the math on a real example.",
        ],
      },
      {
        heading: "Performance fees and the high-water mark",
        paragraphs: [
          "A performance fee is a percentage of the profit a trader generates for you — on Mirrova, between 10% and 30%, set by each trader. The crucial protection is the high-water mark: fees are only charged on profits above your allocation's previous peak.",
          "Worked example: you copy with $2,000 at a 20% performance fee. Month one, the copy grows to $2,300 — you pay 20% of the $300 gain ($60). Your high-water mark is now $2,300. Month two, it falls to $2,100 — you pay nothing. Month three it recovers to $2,250 — still below the $2,300 mark, still nothing. Only when your value exceeds $2,300 does the meter start again. The trader cannot earn twice on the same gain, and earns zero for digging you out of a hole they created.",
        ],
      },
      {
        heading: "Spreads: the fee inside the price",
        paragraphs: [
          "Every trade executes at a price slightly worse than the mid-market price — the spread. It's how execution is financed on commission-free platforms. Spreads matter more the more actively your copied trader trades: a scalper making ten trades a day incurs spread costs that a monthly rebalancer doesn't. Mirrova shows each instrument's spread before you copy; factor it in when comparing a high-frequency and a low-frequency strategist with similar returns.",
        ],
      },
      {
        heading: "Fee traps to avoid anywhere you trade",
        paragraphs: ["Some fee structures are red flags on any platform:"],
        bullets: [
          "Management fees on copied assets — you pay even while losing. Look for 0%.",
          "Performance fees without a high-water mark — you pay repeatedly for the same recovered ground.",
          "Withdrawal fees or exit penalties — friction designed to trap capital.",
          "Subscription tiers gating 'better' traders — quality access shouldn't be a paywall.",
          "Hidden markups: compare the platform's quoted spread against the raw market spread.",
        ],
      },
    ],
  },
  {
    slug: "becoming-a-pro-trader",
    title: "Becoming a Pro Trader: how strategists earn on Mirrova",
    teaser: "The vetting gauntlet, how performance fees compound with copiers, and what separates traders who build a 5,000-copier following from those who stall at 50.",
    minutes: 9,
    level: "Advanced",
    sections: [
      {
        paragraphs: [
          "For skilled traders, copy platforms offer something brokerage accounts can't: leverage on skill without leverage on capital. A strategist managing their own $50,000 earns their own returns; the same strategist with 2,000 copiers earns their own returns plus a performance fee on millions of copied capital. This article explains the path — and the responsibilities.",
        ],
      },
      {
        heading: "The vetting gauntlet",
        paragraphs: [
          "Mirrova lists fewer than 2% of applicants. The bar exists because copiers commit real money to your decisions, and because a leaderboard full of lucky coin-flippers destroys the platform for everyone. The requirements:",
        ],
        bullets: [
          "A verified, continuous 12-month track record — no resets, no cherry-picked accounts, independently confirmed.",
          "A written strategy document: what you trade, why it works, and the risk limits you operate under.",
          "Drawdown discipline consistent with your stated risk band, demonstrated in the record.",
          "A live interview on process: how you size, when you stop, what invalidates a thesis.",
          "Ongoing monitoring after listing — strategy drift or risk-band violations suspend new copies.",
        ],
      },
      {
        heading: "The economics",
        paragraphs: [
          "Pro Traders set a performance fee between 10% and 30%, charged against each copier's high-water mark. The compounding is the point: a trader averaging 2% a month with $5M under copy at a 20% fee earns roughly $20,000 a month from copier profits — while trading exactly as they already did. Copiers scale your income; they never touch your capital, and you never touch theirs.",
        ],
      },
      {
        heading: "What actually grows a following",
        paragraphs: [
          "The platform's data is consistent: copiers arrive for returns but stay for communication and risk behaviour. The strategists who compound to thousands of copiers share three habits: they publish a short rationale with every position, they keep drawdowns inside their stated band even when it costs them upside, and they don't change style after a bad month. The fastest way to lose a thousand copiers is one out-of-character trade.",
        ],
      },
    ],
  },
  {
    slug: "copy-trading-mistakes",
    title: "The seven mistakes that cost copiers the most",
    teaser: "Documented behavioural traps — performance chasing, stop-hunting yourself, over-concentration — and the specific rule that neutralizes each one.",
    minutes: 8,
    level: "Intermediate",
    sections: [
      {
        paragraphs: [
          "Copy trading removes trade selection errors, but it leaves every behavioural error intact — and adds a few of its own. These are the seven most expensive, each paired with the rule that prevents it.",
        ],
      },
      {
        heading: "The seven",
        paragraphs: [],
        bullets: [
          "1 · Performance chasing. Copying whoever tops the 30-day leaderboard buys volatility at its peak. Rule: evaluate on 12+ months and max drawdown, never on last month.",
          "2 · Quitting in drawdowns. Exiting a disciplined trader mid-drawdown converts temporary pain to permanent loss. Rule: decide your exit conditions before copying; a red month isn't one of them.",
          "3 · Over-concentration. One trader, one strategy, all-in. Rule: three to five uncorrelated traders, no single allocation above 40% of your copy capital.",
          "4 · Stop-loss too tight. A 10% stop on a strategy with 15% normal swings guarantees you realize noise as loss. Rule: set stops beyond historical max drawdown, not inside it.",
          "5 · Ignoring correlation. Five crypto traders is one bet. Rule: check market and style overlap before adding a trader, not after.",
          "6 · Interfering with positions. Manually closing the copied trades you dislike destroys the strategy you paid to access. Rule: copy fully or don't copy; your control point is the allocation, not the individual trade.",
          "7 · Sizing with money you need. Rent money makes every drawdown an emergency and every exit forced. Rule: copy only with capital whose loss changes nothing about your month.",
        ],
      },
      {
        heading: "The meta-rule",
        paragraphs: [
          "Every mistake above is a form of improvisation. The copiers who do best on Mirrova write their rules down before allocating a dollar — allocation sizes, stop levels, review cadence, exit conditions — and then do something surprisingly hard: nothing. The strategy is the trader's job. The structure is yours.",
        ],
      },
    ],
  },
];

export function getArticle(slug: string) {
  return ARTICLES.find((a) => a.slug === slug);
}
