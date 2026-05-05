import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";

export type AgronomicForecastInput = {
  crop: string;
  variety: string;
  predecessor: string;
  area: string;
  sowingDate: string;
  harvestDate: string;
  set: string;
  precipitation: string;
  humus: string;
  language?: AgronomicForecastLanguage;
};

export type AgronomicForecastLanguage = "ru" | "en";

export type AgronomicForecastFactor = {
  name: string;
  value: string;
  impact: "pos" | "neg" | "neu";
};

export type AgronomicForecastResult = {
  yield_min: number;
  yield_max: number;
  yield_avg: number;
  confidence: "high" | "medium" | "low";
  analysis: string;
  factors: AgronomicForecastFactor[];
};

const agronomicForecastSchema = {
  name: "agronomic_yield_forecast",
  strict: true,
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      yield_min: { type: "number" },
      yield_max: { type: "number" },
      yield_avg: { type: "number" },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low"],
      },
      analysis: { type: "string" },
      factors: {
        type: "array",
        minItems: 4,
        maxItems: 4,
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            name: { type: "string" },
            value: { type: "string" },
            impact: {
              type: "string",
              enum: ["pos", "neg", "neu"],
            },
          },
          required: ["name", "value", "impact"],
        },
      },
    },
    required: [
      "yield_min",
      "yield_max",
      "yield_avg",
      "confidence",
      "analysis",
      "factors",
    ],
  },
} as const;

const defaultFactorNames: Record<AgronomicForecastLanguage, readonly string[]> = {
  ru: ["СЭТ", "Осадки", "Гумус", "Предшественник"],
  en: ["GDD", "Precipitation", "Humus", "Predecessor"],
};

const factorLabels: Record<
  AgronomicForecastLanguage,
  {
    set: string;
    precipitation: string;
    humus: string;
    predecessor: string;
  }
> = {
  ru: {
    set: "СЭТ",
    precipitation: "Осадки",
    humus: "Гумус",
    predecessor: "Предшественник",
  },
  en: {
    set: "GDD",
    precipitation: "Precipitation",
    humus: "Humus",
    predecessor: "Predecessor",
  },
};

const cropLabels: Record<string, string> = {
  "Пшеница мягкая яровая": "spring soft wheat",
  "Пшеница твёрдая яровая": "spring durum wheat",
  "Ячмень яровой": "spring barley",
  Овёс: "oats",
  "Рапс яровой": "spring rapeseed",
  Гречиха: "buckwheat",
  Горох: "peas",
};

const predecessorLabels: Record<string, string> = {
  Пар: "fallow",
  Горох: "peas",
  Рапс: "rapeseed",
  Гречиха: "buckwheat",
  Лён: "flax",
  Подсолнечник: "sunflower",
  Кукуруза: "corn",
  Пшеница: "wheat",
  "Пшеница мягкая яровая": "spring soft wheat",
  "Пшеница твёрдая яровая": "spring durum wheat",
  Ячмень: "barley",
  "Ячмень яровой": "spring barley",
  Овёс: "oats",
};

const statusLabels: Record<AgronomicForecastLanguage, Record<string, string>> = {
  ru: {
    "нет данных": "нет данных",
    "в рабочем диапазоне": "в рабочем диапазоне",
    "ниже оптимума": "ниже оптимума",
    "выше оптимума": "выше оптимума",
  },
  en: {
    "нет данных": "no data",
    "в рабочем диапазоне": "within the working range",
    "ниже оптимума": "below the optimum",
    "выше оптимума": "above the optimum",
  },
};

type CropHeuristic = {
  baseYield: number;
  setOptimal: [number, number];
  precipOptimal: [number, number];
};

const cropHeuristics: Record<string, CropHeuristic> = {
  "Пшеница мягкая яровая": {
    baseYield: 18.5,
    setOptimal: [1450, 1750],
    precipOptimal: [180, 260],
  },
  "Пшеница твёрдая яровая": {
    baseYield: 16.8,
    setOptimal: [1500, 1800],
    precipOptimal: [160, 240],
  },
  "Ячмень яровой": {
    baseYield: 19.8,
    setOptimal: [1350, 1650],
    precipOptimal: [170, 250],
  },
  "Овёс": {
    baseYield: 17.2,
    setOptimal: [1300, 1600],
    precipOptimal: [190, 280],
  },
  "Рапс яровой": {
    baseYield: 14.4,
    setOptimal: [1450, 1750],
    precipOptimal: [210, 320],
  },
  "Гречиха": {
    baseYield: 12.6,
    setOptimal: [1400, 1750],
    precipOptimal: [180, 260],
  },
  Горох: {
    baseYield: 18.3,
    setOptimal: [1350, 1650],
    precipOptimal: [180, 270],
  },
};

const predecessorScores: Record<string, number> = {
  Пар: 1.8,
  Горох: 1.4,
  Рапс: 1.1,
  Гречиха: 0.7,
  Лён: 0.6,
  Подсолнечник: -0.9,
  Кукуруза: -0.4,
  Пшеница: -1.3,
  "Пшеница мягкая яровая": -1.3,
  "Пшеница твёрдая яровая": -1.3,
  Ячмень: -0.8,
  "Ячмень яровой": -0.8,
  Овёс: -0.5,
};

const extractText = (content: string | Array<{ type: string; text?: string }>) => {
  if (typeof content === "string") {
    return content;
  }

  return content
    .filter(part => part.type === "text")
    .map(part => part.text ?? "")
    .join("\n")
    .trim();
};

const roundToOne = (value: number) => Math.round(value * 10) / 10;

const parseNum = (value: string) => {
  const parsed = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : null;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const evaluateRelativeToRange = (
  value: number | null,
  [min, max]: [number, number],
  spreadMultiplier = 0.45
) => {
  if (value === null) {
    return {
      score: 0,
      impact: "neu" as const,
      status: "нет данных",
    };
  }

  const center = (min + max) / 2;
  const halfRange = (max - min) / 2;
  const safeSpread = Math.max(halfRange * spreadMultiplier, 1);
  const distance = Math.abs(value - center);
  const normalized = clamp(distance / (halfRange + safeSpread), 0, 2);

  if (value >= min && value <= max) {
    return {
      score: 1.8 - normalized * 0.6,
      impact: "pos" as const,
      status: "в рабочем диапазоне",
    };
  }

  if (value < min) {
    return {
      score: -1.8 * normalized,
      impact: "neg" as const,
      status: "ниже оптимума",
    };
  }

  return {
    score: -1.5 * normalized,
    impact: "neg" as const,
    status: "выше оптимума",
  };
};

const evaluateHumus = (
  humus: number | null,
  language: AgronomicForecastLanguage
) => {
  if (humus === null || humus === 0) {
    return {
      score: 0,
      impact: "neu" as const,
      value: language === "ru" ? "нет данных по гумусу" : "no humus data",
    };
  }

  if (humus >= 4) {
    return {
      score: 1.5,
      impact: "pos" as const,
      value: language === "ru" ? "высокое содержание гумуса" : "high humus content",
    };
  }

  if (humus >= 3) {
    return {
      score: 0.9,
      impact: "pos" as const,
      value: language === "ru" ? "хороший уровень гумуса" : "good humus level",
    };
  }

  if (humus >= 2) {
    return {
      score: 0.1,
      impact: "neu" as const,
      value: language === "ru" ? "средний уровень гумуса" : "moderate humus level",
    };
  }

  return {
    score: -1.2,
    impact: "neg" as const,
    value: language === "ru" ? "низкое содержание гумуса" : "low humus content",
  };
};

const buildSetFactorText = (
  setValue: number | null,
  evaluation: ReturnType<typeof evaluateRelativeToRange>,
  language: AgronomicForecastLanguage
) => {
  if (setValue === null) {
    return language === "ru" ? "показатель не указан" : "indicator not provided";
  }

  if (evaluation.impact === "pos") {
    return language === "ru"
      ? `теплообеспеченность достаточная (${roundToOne(setValue)} °C)`
      : `heat supply is sufficient (${roundToOne(setValue)} °C)`;
  }

  if (setValue < 0) {
    return language === "ru"
      ? "значение СЭТ указано некорректно"
      : "GDD value is incorrect";
  }

  return `${statusLabels[language][evaluation.status]} (${roundToOne(setValue)} °C)`;
};

const buildPrecipFactorText = (
  precipitation: number | null,
  evaluation: ReturnType<typeof evaluateRelativeToRange>,
  language: AgronomicForecastLanguage
) => {
  if (precipitation === null) {
    return language === "ru"
      ? "данные по осадкам не указаны"
      : "precipitation data not provided";
  }

  if (evaluation.impact === "pos") {
    return language === "ru"
      ? `влагообеспеченность близка к оптимальной (${roundToOne(precipitation)} мм)`
      : `moisture supply is close to optimal (${roundToOne(precipitation)} mm)`;
  }

  return `${statusLabels[language][evaluation.status]} (${roundToOne(precipitation)} mm)`;
};

const buildPredecessorFactor = (
  predecessor: string,
  language: AgronomicForecastLanguage
) => {
  const score = predecessorScores[predecessor] ?? 0;

  if (score >= 1.2) {
    return {
      score,
      impact: "pos" as const,
      value:
        language === "ru"
          ? "сильный предшественник для текущей культуры"
          : "strong predecessor for the current crop",
    };
  }

  if (score >= 0.4) {
    return {
      score,
      impact: "pos" as const,
      value:
        language === "ru"
          ? "предшественник в целом благоприятный"
          : "predecessor is generally favorable",
    };
  }

  if (score <= -1) {
    return {
      score,
      impact: "neg" as const,
      value:
        language === "ru"
          ? "предшественник может ограничивать потенциал урожайности"
          : "predecessor may limit yield potential",
    };
  }

  if (score < 0) {
    return {
      score,
      impact: "neu" as const,
      value:
        language === "ru"
          ? "предшественник нейтральный, но без выраженного преимущества"
          : "predecessor is neutral without a clear advantage",
    };
  }

  return {
    score: 0,
    impact: "neu" as const,
    value:
      language === "ru"
        ? "предшественник без выраженного влияния"
        : "predecessor has no clear influence",
  };
};

const buildConfidence = (score: number, missingDataCount: number) => {
  if (missingDataCount === 0 && score >= 2.6) {
    return "high" as const;
  }

  if (score <= -1.8 || missingDataCount >= 2) {
    return "low" as const;
  }

  return "medium" as const;
};

const buildAnalysis = ({
  crop,
  avg,
  setEval,
  precipEval,
  humusEval,
  predecessorEval,
  language,
}: {
  crop: string;
  avg: number;
  setEval: ReturnType<typeof evaluateRelativeToRange>;
  precipEval: ReturnType<typeof evaluateRelativeToRange>;
  humusEval: ReturnType<typeof evaluateHumus>;
  predecessorEval: ReturnType<typeof buildPredecessorFactor>;
  language: AgronomicForecastLanguage;
}) => {
  const positives = [
    setEval.impact === "pos"
      ? language === "ru"
        ? "достаточная теплообеспеченность"
        : "sufficient heat supply"
      : null,
    precipEval.impact === "pos"
      ? language === "ru"
        ? "комфортная влагообеспеченность"
        : "comfortable moisture supply"
      : null,
    humusEval.impact === "pos" ? humusEval.value : null,
    predecessorEval.impact === "pos" ? predecessorEval.value : null,
  ].filter(Boolean);

  const constraints = [
    setEval.impact === "neg"
      ? language === "ru"
        ? "тепловой режим сезона ограничивает потенциал"
        : "the season's heat supply limits potential"
      : null,
    precipEval.impact === "neg"
      ? language === "ru"
        ? "влагообеспеченность отклоняется от оптимума"
        : "moisture supply deviates from the optimum"
      : null,
    humusEval.impact === "neg" ? humusEval.value : null,
    predecessorEval.impact === "neg"
      ? language === "ru"
        ? "предшественник снижает устойчивость оценки"
        : "the predecessor reduces assessment stability"
      : null,
  ].filter(Boolean);

  const cropLabel = language === "ru" ? crop : cropLabels[crop] ?? crop;

  const firstSentence =
    language === "ru"
      ? `По заданному сценарию для культуры «${cropLabel}» ожидаемая урожайность оценивается на уровне около ${roundToOne(avg)} ц/га.`
      : `For ${cropLabel}, the expected yield under this scenario is estimated at about ${roundToOne(avg)} c/ha.`;

  const secondSentence =
    positives.length > 0
      ? language === "ru"
        ? `Положительно на результат влияют ${positives.slice(0, 2).join(" и ")}.`
        : `The result is supported by ${positives.slice(0, 2).join(" and ")}.`
      : language === "ru"
        ? "Существенных усиливающих факторов в текущем сценарии не просматривается."
        : "No major strengthening factors are visible in the current scenario.";

  const thirdSentence =
    constraints.length > 0
      ? language === "ru"
        ? `Основные ограничения связаны с тем, что ${constraints.slice(0, 2).join(" и ")}.`
        : `The main limitations are that ${constraints.slice(0, 2).join(" and ")}.`
      : language === "ru"
        ? "Резких ограничений по заданным параметрам не наблюдается, поэтому оценка выглядит устойчивой."
        : "No sharp limitations are visible in the specified parameters, so the assessment looks stable.";

  return `${firstSentence} ${secondSentence} ${thirdSentence}`;
};

const buildHeuristicForecast = (
  input: AgronomicForecastInput
): AgronomicForecastResult => {
  const language = input.language ?? "ru";
  const cropConfig =
    cropHeuristics[input.crop] ?? cropHeuristics["Пшеница мягкая яровая"];
  const setValue = parseNum(input.set);
  const precipitationValue = parseNum(input.precipitation);
  const humusValue = parseNum(input.humus);

  const setEval = evaluateRelativeToRange(setValue, cropConfig.setOptimal);
  const precipEval = evaluateRelativeToRange(
    precipitationValue,
    cropConfig.precipOptimal
  );
  const humusEval = evaluateHumus(humusValue, language);
  const predecessorEval = buildPredecessorFactor(input.predecessor, language);

  const aggregateScore =
    cropConfig.baseYield +
    setEval.score +
    precipEval.score * 1.1 +
    humusEval.score +
    predecessorEval.score;

  const avg = roundToOne(clamp(aggregateScore, 7, 38));
  const variability =
    2.8 +
    (setEval.impact === "neg" ? 1.1 : 0.2) +
    (precipEval.impact === "neg" ? 1.4 : 0.3) +
    (humusValue === null || humusValue === 0 ? 0.7 : 0.1);
  const min = roundToOne(clamp(avg - variability, 5, avg));
  const max = roundToOne(clamp(avg + variability, avg, 42));

  const missingDataCount = [setValue, precipitationValue].filter(v => v === null)
    .length + (humusValue === null || humusValue === 0 ? 1 : 0);

  return {
    yield_min: min,
    yield_max: max,
    yield_avg: avg,
    confidence: buildConfidence(
      setEval.score + precipEval.score + humusEval.score + predecessorEval.score,
      missingDataCount
    ),
    analysis: buildAnalysis({
      crop: input.crop,
      avg,
      setEval,
      precipEval,
      humusEval,
      predecessorEval,
      language,
    }),
    factors: [
      {
        name: factorLabels[language].set,
        value: buildSetFactorText(setValue, setEval, language),
        impact: setEval.impact,
      },
      {
        name: factorLabels[language].precipitation,
        value: buildPrecipFactorText(precipitationValue, precipEval, language),
        impact: precipEval.impact,
      },
      {
        name: factorLabels[language].humus,
        value: humusEval.value,
        impact: humusEval.impact,
      },
      {
        name: factorLabels[language].predecessor,
        value: predecessorEval.value,
        impact: predecessorEval.impact,
      },
    ],
  };
};

const normalizeForecast = (
  raw: AgronomicForecastResult,
  language: AgronomicForecastLanguage
): AgronomicForecastResult => {
  const values = [Number(raw.yield_min), Number(raw.yield_avg), Number(raw.yield_max)]
    .filter(value => Number.isFinite(value));

  if (values.length !== 3) {
    throw new Error("LLM returned invalid numeric values");
  }

  const min = roundToOne(Math.min(...values));
  const max = roundToOne(Math.max(...values));
  const avg = roundToOne(Math.min(Math.max(Number(raw.yield_avg), min), max));

  const factors = defaultFactorNames[language].map((name, index) => {
    const current = raw.factors[index];
    if (!current) {
      return {
        name,
        value: language === "ru" ? "Без выраженного влияния" : "No clear influence",
        impact: "neu" as const,
      };
    }

    return {
      name: current.name || name,
      value:
        current.value ||
        (language === "ru" ? "Без выраженного влияния" : "No clear influence"),
      impact:
        current.impact === "pos" || current.impact === "neg" || current.impact === "neu"
          ? current.impact
          : "neu",
    };
  });

  return {
    yield_min: min,
    yield_max: max,
    yield_avg: avg,
    confidence:
      raw.confidence === "high" ||
      raw.confidence === "medium" ||
      raw.confidence === "low"
        ? raw.confidence
        : "medium",
    analysis:
      raw.analysis?.trim() ||
      (language === "ru"
        ? "Оценка сформирована по заданным параметрам сезона."
        : "The assessment was generated from the specified seasonal parameters."),
    factors,
  };
};

export async function analyzeAgronomicYield(
  input: AgronomicForecastInput
): Promise<AgronomicForecastResult> {
  const language = input.language ?? "ru";

  if (!ENV.forgeApiKey) {
    return buildHeuristicForecast(input);
  }

  const humusValue = input.humus?.trim()
    ? `${input.humus}%`
    : language === "ru"
      ? "нет данных"
      : "no data";
  const cropValue = language === "ru" ? input.crop : cropLabels[input.crop] ?? input.crop;
  const predecessorValue =
    language === "ru"
      ? input.predecessor
      : predecessorLabels[input.predecessor] ?? input.predecessor;

  const prompt =
    language === "ru"
      ? `
Ты агрономический аналитик по растениеводству в условиях Северного Казахстана.
Оцени ожидаемую урожайность реалистично и без завышения. Не используй markdown.

Данные поля:
- Культура: ${cropValue}
- Сорт: ${input.variety}
- Предшественник: ${predecessorValue}
- Площадь: ${input.area} га
- Дата посева: ${input.sowingDate}
- Дата уборки: ${input.harvestDate}
- Сумма эффективных температур (СЭТ): ${input.set} °C
- Осадки за вегетацию: ${input.precipitation} мм
- Содержание гумуса: ${humusValue}

Требования к ответу:
- yield_min, yield_avg и yield_max укажи в ц/га
- confidence укажи как high, medium или low
- analysis напиши на русском, 2-3 деловых предложения
- factors заполни для СЭТ, Осадков, Гумуса и Предшественника
- impact: pos если фактор помогает, neg если ограничивает, neu если влияние нейтральное или умеренное
`.trim()
      : `
You are an agronomic analyst for crop production in Northern Kazakhstan.
Estimate expected yield realistically and without overstatement. Do not use markdown.

Field data:
- Crop: ${cropValue}
- Variety: ${input.variety}
- Predecessor: ${predecessorValue}
- Area: ${input.area} ha
- Sowing date: ${input.sowingDate}
- Harvest date: ${input.harvestDate}
- Growing degree days (GDD): ${input.set} °C
- Precipitation during vegetation: ${input.precipitation} mm
- Humus content: ${humusValue}

Response requirements:
- Set yield_min, yield_avg, and yield_max in c/ha
- Set confidence as high, medium, or low
- Write analysis in English, 2-3 professional sentences
- Fill factors for GDD, Precipitation, Humus, and Predecessor
- impact: pos if the factor supports the result, neg if it limits it, neu if influence is neutral or moderate
`.trim();

  const llmResult = await invokeLLM({
    messages: [
      {
        role: "system",
        content:
          language === "ru"
            ? "Ты сельскохозяйственный аналитик. Отвечай только структурированными данными по заданной схеме."
            : "You are an agricultural analyst. Respond only with structured data that matches the schema.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    responseFormat: {
      type: "json_schema",
      json_schema: agronomicForecastSchema,
    },
  });

  const rawContent = llmResult.choices[0]?.message?.content;
  if (!rawContent) {
    throw new Error("LLM returned an empty response");
  }

  try {
    const parsed = JSON.parse(extractText(rawContent)) as AgronomicForecastResult;
    return normalizeForecast(parsed, language);
  } catch (error) {
    console.error("Failed to parse LLM agronomic forecast, using heuristic fallback:", error);
    return buildHeuristicForecast(input);
  }
}
