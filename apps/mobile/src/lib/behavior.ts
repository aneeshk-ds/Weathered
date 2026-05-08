import type {
  BehavioralRead,
  BehaviorSignal,
  DecisionCategory,
  EnergyLevel,
  RecommendationNudge,
  WeatherSnapshot,
} from "@weathered/shared";

export function buildBehavioralRead({
  mood,
  energy,
  weather,
}: {
  mood: number;
  energy: EnergyLevel;
  weather: WeatherSnapshot;
}): BehavioralRead {
  const signals = [
    buildFocusSignal(mood, energy, weather),
    buildSocialSignal(mood, energy, weather),
    buildRiskSignal(mood, energy, weather),
  ];

  return {
    title: "Today's Behavioral Read",
    summary: buildSummary(signals),
    signals,
  };
}

export function buildRecommendationNudges({
  read,
  category,
  mood,
  energy,
  weather,
}: {
  read: BehavioralRead;
  category: DecisionCategory;
  mood: number;
  energy: EnergyLevel;
  weather: WeatherSnapshot;
}): RecommendationNudge[] {
  const riskSignal = read.signals.find((signal) => signal.label === "Decision Risk");
  const focusSignal = read.signals.find((signal) => signal.label === "Focus");
  const socialSignal = read.signals.find((signal) => signal.label === "Social");

  if (riskSignal?.level === "strong") {
    return [
      {
        id: "nudge-delay-irrevocable",
        title: "Slow the irreversible part",
        message: "This is a better moment for gathering one more data point than locking in a high-stakes choice.",
        actionLabel: "Decide the next small step only",
        tone: "caution",
      },
      buildCategoryNudge(category, "caution"),
    ];
  }

  if (category === "work" && focusSignal?.level === "strong") {
    return [
      {
        id: "nudge-use-focus-window",
        title: "Use the focus window",
        message: "Your current read supports structured work. Put the hardest part first while attention is available.",
        actionLabel: "Start with a 25-minute focused block",
        tone: "encourage",
      },
      buildCategoryNudge(category, "encourage"),
    ];
  }

  if (category === "social" && socialSignal?.level === "strong") {
    return [
      {
        id: "nudge-social-follow-through",
        title: "Follow through while it feels easy",
        message: "This looks like a good window for connection, especially if the plan stays simple.",
        actionLabel: "Confirm the plan or send the message",
        tone: "encourage",
      },
      buildCategoryNudge(category, "encourage"),
    ];
  }

  if (category === "spending" && (weather.condition === "sunny" || mood >= 8)) {
    return [
      {
        id: "nudge-spending-cooling-off",
        title: "Add a short cooling-off step",
        message: "Good momentum can make purchases feel more obvious than they are. Give the choice a quick second look.",
        actionLabel: "Wait 20 minutes before buying",
        tone: "reframe",
      },
      buildCategoryNudge(category, "reframe"),
    ];
  }

  if (energy === "low") {
    return [
      {
        id: "nudge-low-energy-version",
        title: "Choose the lighter version",
        message: "The useful decision may be the one that preserves capacity, not the one that proves discipline.",
        actionLabel: "Reduce the scope before deciding",
        tone: "reframe",
      },
      buildCategoryNudge(category, "reframe"),
    ];
  }

  return [
    {
      id: "nudge-balanced-choice",
      title: "Make the choice match the moment",
      message: "No major caution signal is showing. A normal decision pace looks reasonable if the next step is clear.",
      actionLabel: "Proceed with one clear check",
      tone: "encourage",
    },
    buildCategoryNudge(category, "encourage"),
  ];
}

function buildCategoryNudge(category: DecisionCategory, tone: RecommendationNudge["tone"]): RecommendationNudge {
  if (category === "social") {
    return {
      id: `nudge-${tone}-social`,
      title: "Protect the relationship",
      message: "Favor a plan that keeps trust intact, even if the plan needs to become smaller.",
      actionLabel: "Offer a clear yes, no, or backup",
      tone,
    };
  }

  if (category === "work") {
    return {
      id: `nudge-${tone}-work`,
      title: "Avoid all-or-nothing work",
      message: "A smaller completed step beats a large intention that collapses under the day.",
      actionLabel: "Define the smallest useful output",
      tone,
    };
  }

  if (category === "spending") {
    return {
      id: `nudge-${tone}-spending`,
      title: "Separate wanting from timing",
      message: "The purchase may still be right; the nudge is to make timing part of the decision.",
      actionLabel: "Check need, budget, and timing",
      tone,
    };
  }

  return {
    id: `nudge-${tone}-other`,
    title: "Name the decision shape",
    message: "When the category is broad, clarity matters more than speed.",
    actionLabel: "Write the actual choice in one line",
    tone,
  };
}

function buildFocusSignal(mood: number, energy: EnergyLevel, weather: WeatherSnapshot): BehaviorSignal {
  if (energy === "high" && weather.temperatureC <= 27) {
    return {
      id: "focus-strong",
      label: "Focus",
      level: "strong",
      message: "Good conditions for analytical work or structured planning.",
    };
  }

  if (energy === "low" || weather.temperatureC >= 30) {
    return {
      id: "focus-low",
      label: "Focus",
      level: "low",
      message: "Keep cognitive load smaller; a lighter task may fit better.",
    };
  }

  return {
    id: "focus-moderate",
    label: "Focus",
    level: mood >= 6 ? "strong" : "moderate",
    message: "Steady enough for focused work, especially if the scope is clear.",
  };
}

function buildSocialSignal(mood: number, energy: EnergyLevel, weather: WeatherSnapshot): BehaviorSignal {
  if (weather.condition === "sunny" && mood >= 7 && energy !== "low") {
    return {
      id: "social-strong",
      label: "Social",
      level: "strong",
      message: "This looks like a good window for connection or follow-through.",
    };
  }

  if (mood <= 4 || energy === "low") {
    return {
      id: "social-low",
      label: "Social",
      level: "low",
      message: "A softer version of a plan may be easier than forcing the full thing.",
    };
  }

  return {
    id: "social-moderate",
    label: "Social",
    level: "moderate",
    message: "Social follow-through may work best with a simple, low-friction plan.",
  };
}

function buildRiskSignal(mood: number, energy: EnergyLevel, weather: WeatherSnapshot): BehaviorSignal {
  if (weather.temperatureC >= 30 || (mood <= 4 && energy === "low")) {
    return {
      id: "risk-strong",
      label: "Decision Risk",
      level: "strong",
      message: "Pause before irreversible choices; this context may reward a slower decision.",
    };
  }

  if (weather.condition === "sunny" && mood >= 8) {
    return {
      id: "risk-moderate-sunny",
      label: "Decision Risk",
      level: "moderate",
      message: "Momentum is useful, but bigger choices may still deserve a quick second pass.",
    };
  }

  return {
    id: "risk-low",
    label: "Decision Risk",
    level: "low",
    message: "No obvious caution signal; normal decision pace looks reasonable.",
  };
}

function buildSummary(signals: BehaviorSignal[]) {
  const strongSignals = signals.filter((signal) => signal.level === "strong");
  const riskSignal = signals.find((signal) => signal.label === "Decision Risk");

  if (riskSignal?.level === "strong") {
    return "A pause-worthy context: choose smaller steps before bigger commitments.";
  }

  if (strongSignals.some((signal) => signal.label === "Focus")) {
    return "A useful focus window: structured work may feel easier than usual.";
  }

  if (strongSignals.some((signal) => signal.label === "Social")) {
    return "A good social window: connection and follow-through may come more naturally.";
  }

  return "A balanced context: keep the decision small enough to match your current capacity.";
}
