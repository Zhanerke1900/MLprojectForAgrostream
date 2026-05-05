import { SectionIntro, SiteShell } from "@/components/site/SiteShell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage, type Language } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import {
  Activity,
  BadgeCheck,
  CalendarRange,
  CloudRain,
  Download,
  Droplets,
  FileImage,
  FileText,
  History,
  Loader2,
  Map,
  Upload,
  ShieldCheck,
  Sprout,
  Thermometer,
  Wheat,
} from "lucide-react";
import { useState } from "react";

type AgronomicFactor = {
  name: string;
  value: string;
  impact: "pos" | "neg" | "neu";
};

type AgronomicResult = {
  yield_min: number;
  yield_max: number;
  yield_avg: number;
  confidence: "high" | "medium" | "low";
  analysis: string;
  factors: AgronomicFactor[];
};

type MaterialFile = {
  name: string;
  type: string;
  size: number;
};

const FIELD_SCENARIO = {
  crop: "Пшеница мягкая яровая",
  variety: "Нерда",
  reproduction: "Первая",
  predecessor: "Лён",
  area: "291.2",
  sowingDate: "19.05.2025 - 20.05.2025",
  harvestDate: "20.09.2025 - 21.09.2025",
  mapYear: "2025",
} as const;

const confidenceStyles: Record<AgronomicResult["confidence"], string> = {
  high: "bg-emerald-500/15 text-emerald-200",
  medium: "bg-amber-500/15 text-amber-200",
  low: "bg-rose-500/15 text-rose-200",
};

const impactStyles: Record<AgronomicFactor["impact"], string> = {
  pos: "text-emerald-700 bg-emerald-50 border-emerald-200",
  neg: "text-rose-700 bg-rose-50 border-rose-200",
  neu: "text-amber-700 bg-amber-50 border-amber-200",
};

const forecastCopy: Record<Language, any> = {
  ru: {
    locale: "ru-RU",
    hero: {
      eyebrow: "Оценка поля",
      title: "Расчетная сезонная оценка по карточке поля и сезонным показателям",
      description:
        "Из ваших материалов берется контекст поля. Число урожайности появляется после добавления сезонных показателей: СЭТ, осадков и при возможности гумуса.",
      cards: [
        {
          icon: FileImage,
          title: "Что уже есть",
          text: "Карточка поля, карта урожайности, площадь, культура, предшественник и даты сезона.",
        },
        {
          icon: Thermometer,
          title: "Что нужно ввести",
          text: "СЭТ, осадки за вегетацию и гумус, если есть подтвержденное значение.",
        },
        {
          icon: Activity,
          title: "Что будет на выходе",
          text: "Рабочий диапазон урожайности, надежность оценки и агрономическое пояснение.",
        },
      ],
    },
    process: {
      eyebrow: "Смысл страницы",
      title: "Сначала описываем поле, затем выполняем расчет",
      description:
        "Пользователь видит, какие сведения пришли из материалов, а какие показатели были добавлены вручную для расчетной оценки.",
      steps: [
        "Карточка и карта задают контекст, но не заменяют сезонные показатели.",
        "Ручной ввод делает оценку численной и пригодной для обсуждения.",
        "Итоговый экран показывает расчетный сценарий по текущим данным.",
      ],
    },
    context: {
      eyebrow: "Контекст поля",
      title: "Что мы уже знаем из ваших материалов",
      useLabel: "Как используются материалы",
      manualLabel: "Что добавляется вручную",
      materialMeaning: [
        "карточка поля фиксирует культуру, сорт, предшественник и площадь",
        "карта урожайности задает контекст неоднородности поля",
        "даты посева и уборки привязывают оценку к конкретному сезону",
        "сезонные показатели уточняют расчет и повышают надежность вывода",
      ],
      manualInputs: [
        "СЭТ описывает тепловой ресурс сезона",
        "осадки показывают влагообеспеченность за вегетацию",
        "гумус добавляет почвенный контекст",
      ],
    },
    passportCards: [
      { label: "Культура", value: "Пшеница мягкая яровая", icon: Wheat },
      { label: "Сорт", value: "Нерда", icon: Sprout },
      { label: "Репродукция", value: "Первая", icon: ShieldCheck },
      { label: "Предшественник", value: "Лён", icon: Activity },
      { label: "Площадь", value: "291.2 га", icon: Map },
      { label: "Карта", value: "Карта урожайности 2025", icon: CalendarRange },
    ],
    inputs: {
      set: "СЭТ, °C",
      setPlaceholder: "Например: 1500",
      setHelp:
        "Без этого значения материалы поля остаются контекстом, а не расчетной оценкой.",
      precipitation: "Осадки за вегетацию, мм",
      precipitationPlaceholder: "Например: 250",
      precipitationHelp:
        "Это один из главных численных факторов для текущего сценария сезона.",
      humus: "Содержание гумуса, %",
      humusPlaceholder: "Например: 3.2",
      humusHelp:
        "Если точного значения нет, можно оставить поле пустым, но надежность оценки будет ниже.",
      submit: "Рассчитать оценку поля",
      loading: "Считаем оценку...",
      reset: "Сбросить",
    },
    materials: {
      title: "Материалы к расчету",
      description:
        "Прикрепите карточку поля, карту урожайности или анализ почвы. Сейчас в историю сохраняются имя, тип и размер файла.",
      button: "Выбрать файлы",
      empty: "Файлы пока не выбраны",
      count: "Выбрано файлов",
    },
    emptyResult: {
      eyebrow: "Что считает страница",
      title: "На выходе получается рабочая сезонная оценка",
      description:
        "После расчета сервис покажет диапазон урожайности, среднее ожидаемое значение, надежность оценки и ключевые факторы влияния.",
      tiles: [
        { value: "КОНТЕКСТ", title: "карточка и карта поля" },
        { value: "ПОКАЗАТЕЛИ", title: "СЭТ, осадки, гумус" },
        { value: "ВЫВОД", title: "диапазон и пояснение" },
      ],
      noteEyebrow: "Почему одной карты недостаточно",
      noteTitle: "Карта поля задает фон, но не заменяет сезонные показатели",
      noteItems: [
        "По карте можно увидеть поле и его неоднородность, но для расчета нужны численные условия сезона.",
        "СЭТ и осадки переводят контекст сезона в агрономическую оценку.",
        "Гумус не обязателен, но помогает сделать вывод более устойчивым.",
      ],
    },
    result: {
      avg: "Средняя оценка",
      range: "Рабочий диапазон",
      confidence: "Надежность оценки",
      unit: "ц/га",
      confidenceNote: "зависит от полноты и качества текущих данных",
      analysisEyebrow: "Что это значит",
      analysisTitle: "Агрономическое пояснение к оценке",
      factorsEyebrow: "Факторы влияния",
      factorsTitle: "Что сильнее всего сформировало результат",
      downloadPdf: "Скачать PDF-отчет",
      savePdfHint: "В открывшемся окне выберите Save as PDF / Сохранить как PDF.",
      historySaved: "Расчет сохранен в историю.",
      historySaveFailed:
        "Расчет выполнен, но история не сохранена: база данных недоступна.",
      confidenceLabels: {
        high: "высокая",
        medium: "средняя",
        low: "низкая",
      },
    },
    errors: {
      fallback: "Не удалось выполнить расчет. Попробуйте еще раз.",
      server: "Ошибка оценки",
    },
    stepLabel: "Шаг",
  },
  en: {
    locale: "en-US",
    hero: {
      eyebrow: "Field assessment",
      title: "Calculated seasonal assessment from the field profile and indicators",
      description:
        "Your materials provide field context. The yield number appears after adding seasonal indicators: GDD, precipitation, and humus when available.",
      cards: [
        {
          icon: FileImage,
          title: "Available inputs",
          text: "Field profile, yield map, area, crop, predecessor, and season dates.",
        },
        {
          icon: Thermometer,
          title: "What to enter",
          text: "GDD, vegetation-period precipitation, and humus if a confirmed value is available.",
        },
        {
          icon: Activity,
          title: "Output",
          text: "Working yield range, assessment confidence, and agronomic explanation.",
        },
      ],
    },
    process: {
      eyebrow: "Page purpose",
      title: "First describe the field, then run the calculation",
      description:
        "The user sees which information came from materials and which indicators were added manually for the calculated assessment.",
      steps: [
        "The field profile and map define context, but do not replace seasonal indicators.",
        "Manual input makes the estimate numeric and useful for discussion.",
        "The result screen shows a calculated scenario based on current data.",
      ],
    },
    context: {
      eyebrow: "Field context",
      title: "What we already know from your materials",
      useLabel: "How materials are used",
      manualLabel: "What is added manually",
      materialMeaning: [
        "the field profile records crop, variety, predecessor, and area",
        "the yield map provides field variability context",
        "sowing and harvest dates tie the estimate to a specific season",
        "seasonal indicators refine the calculation and improve reliability",
      ],
      manualInputs: [
        "GDD describes the season's heat resource",
        "precipitation shows moisture supply during vegetation",
        "humus adds soil context",
      ],
    },
    passportCards: [
      { label: "Crop", value: "Spring soft wheat", icon: Wheat },
      { label: "Variety", value: "Nerda", icon: Sprout },
      { label: "Reproduction", value: "First", icon: ShieldCheck },
      { label: "Predecessor", value: "Flax", icon: Activity },
      { label: "Area", value: "291.2 ha", icon: Map },
      { label: "Map", value: "Yield map 2025", icon: CalendarRange },
    ],
    inputs: {
      set: "GDD, °C",
      setPlaceholder: "For example: 1500",
      setHelp:
        "Without this value, field materials remain context rather than a calculated estimate.",
      precipitation: "Precipitation during vegetation, mm",
      precipitationPlaceholder: "For example: 250",
      precipitationHelp:
        "This is one of the main numeric factors for the current seasonal scenario.",
      humus: "Humus content, %",
      humusPlaceholder: "For example: 3.2",
      humusHelp:
        "If there is no exact value, you can leave it empty, but confidence will be lower.",
      submit: "Calculate field assessment",
      loading: "Calculating assessment...",
      reset: "Reset",
    },
    materials: {
      title: "Materials for the assessment",
      description:
        "Attach the field profile, yield map, or soil analysis. For now, the history stores file name, type, and size.",
      button: "Choose files",
      empty: "No files selected yet",
      count: "Files selected",
    },
    emptyResult: {
      eyebrow: "What the page calculates",
      title: "The output is a working seasonal assessment",
      description:
        "After calculation, the service shows a yield range, expected average, confidence level, and key influence factors.",
      tiles: [
        { value: "CONTEXT", title: "field profile and map" },
        { value: "INDICATORS", title: "GDD, precipitation, humus" },
        { value: "OUTPUT", title: "range and explanation" },
      ],
      noteEyebrow: "Why one map is not enough",
      noteTitle: "The field map provides context, but does not replace seasonal indicators",
      noteItems: [
        "A map can show the field and variability, but the calculation needs numeric season conditions.",
        "GDD and precipitation turn season context into an agronomic assessment.",
        "Humus is optional, but it helps make the conclusion more stable.",
      ],
    },
    result: {
      avg: "Average estimate",
      range: "Working range",
      confidence: "Assessment confidence",
      unit: "c/ha",
      confidenceNote: "depends on the completeness and quality of current data",
      analysisEyebrow: "What it means",
      analysisTitle: "Agronomic explanation of the assessment",
      factorsEyebrow: "Influence factors",
      factorsTitle: "What shaped the result most",
      downloadPdf: "Download PDF report",
      savePdfHint: "In the opened window, choose Save as PDF.",
      historySaved: "Calculation saved to history.",
      historySaveFailed:
        "The calculation is complete, but history was not saved: database is unavailable.",
      confidenceLabels: {
        high: "high",
        medium: "medium",
        low: "low",
      },
    },
    errors: {
      fallback: "Could not complete the calculation. Please try again.",
      server: "Assessment error",
    },
    stepLabel: "Step",
  },
};

const formatYield = (value: number, locale: string) =>
  new Intl.NumberFormat(locale, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);

const formatFileSize = (size: number, locale: string) => {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(size / 1024)} KB`;
  }

  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(size / (1024 * 1024))} MB`;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function openPrintableReport({
  t,
  locale,
  result,
  form,
  materials,
}: {
  t: any;
  locale: string;
  result: AgronomicResult;
  form: { set: string; precipitation: string; humus: string };
  materials: MaterialFile[];
}) {
  const factorRows = result.factors
    .map(
      factor => `
        <tr>
          <td>${escapeHtml(factor.name)}</td>
          <td>${escapeHtml(factor.value)}</td>
          <td>${escapeHtml(factor.impact)}</td>
        </tr>
      `
    )
    .join("");
  const materialRows =
    materials.length > 0
      ? materials
          .map(
            item => `
              <tr>
                <td>${escapeHtml(item.name)}</td>
                <td>${escapeHtml(item.type || "-")}</td>
                <td>${escapeHtml(formatFileSize(item.size, locale))}</td>
              </tr>
            `
          )
          .join("")
      : `<tr><td colspan="3">${escapeHtml(t.materials.empty)}</td></tr>`;

  const reportHtml = `
    <!doctype html>
    <html>
      <head>
        <title>Field Review Report</title>
        <meta charset="utf-8" />
        <style>
          body { font-family: Arial, sans-serif; color: #14251b; margin: 40px; }
          h1 { font-size: 28px; margin-bottom: 4px; }
          h2 { font-size: 18px; margin-top: 28px; border-bottom: 1px solid #d6decd; padding-bottom: 8px; }
          .muted { color: #647067; }
          .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin: 22px 0; }
          .metric { border: 1px solid #d6decd; border-radius: 12px; padding: 14px; background: #f8f6ee; }
          .metric strong { display: block; font-size: 24px; margin-top: 8px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #d6decd; padding: 10px; text-align: left; vertical-align: top; }
          th { background: #f0ebdc; }
          .actions { margin-top: 30px; }
          button { background: #163d2b; color: white; border: 0; border-radius: 999px; padding: 12px 18px; font-weight: 700; cursor: pointer; }
          @media print { .actions { display: none; } body { margin: 22mm; } }
        </style>
      </head>
      <body>
        <h1>Field Review</h1>
        <p class="muted">${escapeHtml(new Date().toLocaleString(locale))}</p>

        <div class="grid">
          <div class="metric">${escapeHtml(t.result.avg)}<strong>${escapeHtml(formatYield(result.yield_avg, locale))} ${escapeHtml(t.result.unit)}</strong></div>
          <div class="metric">${escapeHtml(t.result.range)}<strong>${escapeHtml(formatYield(result.yield_min, locale))} - ${escapeHtml(formatYield(result.yield_max, locale))} ${escapeHtml(t.result.unit)}</strong></div>
          <div class="metric">${escapeHtml(t.result.confidence)}<strong>${escapeHtml(t.result.confidenceLabels[result.confidence])}</strong></div>
        </div>

        <h2>${escapeHtml(t.context.eyebrow)}</h2>
        <table>
          <tr><th>${escapeHtml(t.passportCards[0].label)}</th><td>${escapeHtml(t.passportCards[0].value)}</td></tr>
          <tr><th>${escapeHtml(t.passportCards[1].label)}</th><td>${escapeHtml(t.passportCards[1].value)}</td></tr>
          <tr><th>${escapeHtml(t.passportCards[3].label)}</th><td>${escapeHtml(t.passportCards[3].value)}</td></tr>
          <tr><th>${escapeHtml(t.passportCards[4].label)}</th><td>${escapeHtml(t.passportCards[4].value)}</td></tr>
          <tr><th>${escapeHtml(t.inputs.set)}</th><td>${escapeHtml(form.set)}</td></tr>
          <tr><th>${escapeHtml(t.inputs.precipitation)}</th><td>${escapeHtml(form.precipitation)}</td></tr>
          <tr><th>${escapeHtml(t.inputs.humus)}</th><td>${escapeHtml(form.humus || "-")}</td></tr>
        </table>

        <h2>${escapeHtml(t.result.analysisTitle)}</h2>
        <p>${escapeHtml(result.analysis)}</p>

        <h2>${escapeHtml(t.result.factorsTitle)}</h2>
        <table>
          <thead><tr><th>Factor</th><th>Value</th><th>Impact</th></tr></thead>
          <tbody>${factorRows}</tbody>
        </table>

        <h2>${escapeHtml(t.materials.title)}</h2>
        <table>
          <thead><tr><th>File</th><th>Type</th><th>Size</th></tr></thead>
          <tbody>${materialRows}</tbody>
        </table>

        <div class="actions">
          <button onclick="window.print()">${escapeHtml(t.result.downloadPdf)}</button>
          <p class="muted">${escapeHtml(t.result.savePdfHint)}</p>
        </div>
      </body>
    </html>
  `;
  const reportUrl = URL.createObjectURL(
    new Blob([reportHtml], { type: "text/html;charset=utf-8" })
  );
  const reportWindow = window.open(
    reportUrl,
    "_blank",
    "noopener,noreferrer,width=980,height=780"
  );

  if (!reportWindow) {
    URL.revokeObjectURL(reportUrl);
    return;
  }

  reportWindow.focus();
  window.setTimeout(() => URL.revokeObjectURL(reportUrl), 60_000);
}

export default function Forecast() {
  const { language } = useLanguage();
  const t = forecastCopy[language];
  const createHistory = trpc.forecastHistory.create.useMutation();
  const [form, setForm] = useState({
    set: "",
    precipitation: "",
    humus: "",
  });
  const [materials, setMaterials] = useState<MaterialFile[]>([]);
  const [result, setResult] = useState<AgronomicResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [historyMsg, setHistoryMsg] = useState<string | null>(null);

  function setField(name: keyof typeof form, value: string) {
    setForm(prev => ({ ...prev, [name]: value }));
  }

  function handleMaterialsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []).slice(0, 12);
    setMaterials(
      files.map(file => ({
        name: file.name,
        type: file.type || "application/octet-stream",
        size: file.size,
      }))
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setResult(null);
    setHistoryMsg(null);

    try {
      const response = await fetch("/api/agronomic-predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          crop: FIELD_SCENARIO.crop,
          variety: FIELD_SCENARIO.variety,
          predecessor: FIELD_SCENARIO.predecessor,
          area: FIELD_SCENARIO.area,
          sowingDate: FIELD_SCENARIO.sowingDate,
          harvestDate: FIELD_SCENARIO.harvestDate,
          set: form.set,
          precipitation: form.precipitation,
          humus: form.humus,
          language,
        }),
      });

      const data = (await response.json()) as AgronomicResult | { error?: string };

      if (!response.ok) {
        throw new Error("error" in data && data.error ? data.error : t.errors.server);
      }

      const forecastResult = data as AgronomicResult;
      setResult(forecastResult);

      try {
        await createHistory.mutateAsync({
          crop: FIELD_SCENARIO.crop,
          variety: FIELD_SCENARIO.variety,
          predecessor: FIELD_SCENARIO.predecessor,
          area: FIELD_SCENARIO.area,
          sowingDate: FIELD_SCENARIO.sowingDate,
          harvestDate: FIELD_SCENARIO.harvestDate,
          set: form.set,
          precipitation: form.precipitation,
          humus: form.humus,
          language,
          materials,
          result: forecastResult,
        });
        setHistoryMsg(t.result.historySaved);
      } catch (historyError) {
        console.error(historyError);
        setHistoryMsg(t.result.historySaveFailed);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg(error instanceof Error ? error.message : t.errors.fallback);
    } finally {
      setLoading(false);
    }
  }

  function resetScenario() {
    setForm({
      set: "",
      precipitation: "",
      humus: "",
    });
    setMaterials([]);
    setResult(null);
    setErrorMsg(null);
    setHistoryMsg(null);
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-14 lg:pt-18">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
          <div className="panel-surface p-7 sm:p-9">
            <SectionIntro
              eyebrow={t.hero.eyebrow}
              title={t.hero.title}
              description={t.hero.description}
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {t.hero.cards.map((item: any) => {
                const Icon = item.icon;

                return (
                  <div key={item.title} className="field-shell">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#163d2b] text-[#d8b26b]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="mt-4 text-base font-semibold text-slate-950">{item.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{item.text}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="olive-surface rounded-[36px] p-7 text-white sm:p-9">
            <SectionIntro
              eyebrow={t.process.eyebrow}
              title={t.process.title}
              description={t.process.description}
              tone="dark"
            />

            <div className="mt-8 space-y-4">
              {t.process.steps.map((item: string, index: number) => (
                <div
                  key={item}
                  className="rounded-[24px] border border-white/8 bg-white/6 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-[#d8b26b]">
                    {t.stepLabel} {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-3 text-sm leading-7 text-emerald-50/70">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[0.96fr_1.04fr]">
          <div className="panel-surface p-7 sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#163d2b] text-[#d8b26b]">
                <Map className="h-5 w-5" />
              </span>
              <div>
                <p className="section-kicker">{t.context.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {t.context.title}
                </h2>
              </div>
            </div>

            <div className="mt-7 grid gap-4 md:grid-cols-2">
              {t.passportCards.map((item: any) => {
                const Icon = item.icon;

                return (
                  <div key={item.label} className="field-shell">
                    <div className="flex items-start gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1e9d7] text-[#163d2b]">
                        <Icon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                          {item.label}
                        </p>
                        <p className="mt-2 text-sm font-medium leading-7 text-slate-800">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-[24px] border border-slate-900/8 bg-[#f8f4ea] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                {t.context.useLabel}
              </p>
              <div className="mt-4 space-y-3">
                {t.context.materialMeaning.map((item: string) => (
                  <div key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                    <BadgeCheck className="mt-1 h-4 w-4 text-[#1d5a3f]" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 field-shell">
              <div className="flex items-start gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1e9d7] text-[#163d2b]">
                  <Upload className="h-4 w-4" />
                </span>
                <div>
                  <p className="text-base font-semibold text-slate-950">{t.materials.title}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {t.materials.description}
                  </p>
                </div>
              </div>

              <div className="mt-5">
                <Label
                  htmlFor="materials"
                  className="inline-flex h-11 items-center gap-2 rounded-full bg-[#163d2b] px-5 text-sm font-semibold text-white hover:bg-[#112d20]"
                >
                  <FileText className="h-4 w-4" />
                  {t.materials.button}
                </Label>
                <Input
                  id="materials"
                  type="file"
                  multiple
                  onChange={handleMaterialsChange}
                  className="sr-only"
                  accept=".pdf,.xlsx,.xls,.csv,.png,.jpg,.jpeg,.webp"
                />
              </div>

              <div className="mt-4 space-y-2">
                {materials.length === 0 ? (
                  <p className="text-sm text-slate-500">{t.materials.empty}</p>
                ) : (
                  <>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      {t.materials.count}: {materials.length}
                    </p>
                    {materials.map(item => (
                      <div
                        key={`${item.name}-${item.size}`}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-900/8 bg-white/80 px-4 py-3 text-sm"
                      >
                        <span className="font-medium text-slate-800">{item.name}</span>
                        <span className="text-slate-500">{formatFileSize(item.size, t.locale)}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
              <div className="field-shell">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
                  {t.context.manualLabel}
                </p>
                <div className="mt-4 space-y-3">
                  {t.context.manualInputs.map((item: string) => (
                    <div key={item} className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                      <BadgeCheck className="mt-1 h-4 w-4 text-[#1d5a3f]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-5 grid gap-4">
                  <div>
                    <Label
                      htmlFor="set"
                      className="flex items-center gap-3 text-sm font-medium text-slate-800"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f1e9d7] text-[#163d2b]">
                        <Thermometer className="h-4 w-4" />
                      </span>
                      <span>{t.inputs.set}</span>
                    </Label>
                    <Input
                      id="set"
                      type="number"
                      value={form.set}
                      onChange={e => setField("set", e.target.value)}
                      className="mt-4 h-12 rounded-2xl border-slate-900/8 bg-white/92"
                      placeholder={t.inputs.setPlaceholder}
                      required
                    />
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {t.inputs.setHelp}
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="precipitation"
                      className="flex items-center gap-3 text-sm font-medium text-slate-800"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f1e9d7] text-[#163d2b]">
                        <CloudRain className="h-4 w-4" />
                      </span>
                      <span>{t.inputs.precipitation}</span>
                    </Label>
                    <Input
                      id="precipitation"
                      type="number"
                      value={form.precipitation}
                      onChange={e => setField("precipitation", e.target.value)}
                      className="mt-4 h-12 rounded-2xl border-slate-900/8 bg-white/92"
                      placeholder={t.inputs.precipitationPlaceholder}
                      required
                    />
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {t.inputs.precipitationHelp}
                    </p>
                  </div>

                  <div>
                    <Label
                      htmlFor="humus"
                      className="flex items-center gap-3 text-sm font-medium text-slate-800"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#f1e9d7] text-[#163d2b]">
                        <Droplets className="h-4 w-4" />
                      </span>
                      <span>{t.inputs.humus}</span>
                    </Label>
                    <Input
                      id="humus"
                      type="number"
                      step="0.1"
                      value={form.humus}
                      onChange={e => setField("humus", e.target.value)}
                      className="mt-4 h-12 rounded-2xl border-slate-900/8 bg-white/92"
                      placeholder={t.inputs.humusPlaceholder}
                    />
                    <p className="mt-3 text-sm leading-6 text-slate-500">
                      {t.inputs.humusHelp}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="submit"
                  disabled={loading || !form.set || !form.precipitation}
                  className="h-12 flex-1 rounded-full bg-[#163d2b] text-white hover:bg-[#112d20]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {t.inputs.loading}
                    </>
                  ) : (
                    <>
                      <Sprout className="mr-2 h-4 w-4" />
                      {t.inputs.submit}
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetScenario}
                  className="h-12 rounded-full border-emerald-950/10 bg-white/86 px-6 text-slate-700 hover:bg-white"
                >
                  {t.inputs.reset}
                </Button>
              </div>
            </form>

            {errorMsg ? (
              <div className="mt-5 rounded-[24px] border border-red-500/12 bg-red-50 p-4 text-sm text-red-700">
                {errorMsg}
              </div>
            ) : null}
          </div>

          <div className="space-y-5">
            {!result ? (
              <>
                <div className="panel-surface p-7">
                  <SectionIntro
                    eyebrow={t.emptyResult.eyebrow}
                    title={t.emptyResult.title}
                    description={t.emptyResult.description}
                  />

                  <div className="mt-8 grid gap-4 sm:grid-cols-3">
                    {t.emptyResult.tiles.map((item: { value: string; title: string }) => (
                      <div key={item.title} className="field-shell text-center">
                        <p className="text-xs uppercase tracking-[0.24em] text-slate-400">
                          {item.value}
                        </p>
                        <p className="mt-3 text-sm font-medium text-slate-800">{item.title}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="olive-surface rounded-[32px] p-6 text-white">
                  <p className="section-kicker">{t.emptyResult.noteEyebrow}</p>
                  <h3 className="mt-5 text-2xl font-semibold text-white">
                    {t.emptyResult.noteTitle}
                  </h3>
                  <div className="mt-5 space-y-4">
                    {t.emptyResult.noteItems.map((item: string) => (
                      <div
                        key={item}
                        className="rounded-[22px] border border-white/8 bg-white/6 p-4 text-sm leading-7 text-emerald-50/70"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="metric-card">
                    <p className="text-sm font-medium text-slate-500">{t.result.avg}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      {formatYield(result.yield_avg, t.locale)}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">{t.result.unit}</p>
                  </div>

                  <div className="metric-card">
                    <p className="text-sm font-medium text-slate-500">{t.result.range}</p>
                    <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
                      {formatYield(result.yield_min, t.locale)} - {formatYield(result.yield_max, t.locale)}
                    </p>
                    <p className="mt-3 text-sm text-slate-500">{t.result.unit}</p>
                  </div>

                  <div className="metric-card">
                    <p className="text-sm font-medium text-slate-500">{t.result.confidence}</p>
                    <div className="mt-4">
                      <Badge
                        className={`rounded-full px-4 py-1.5 text-sm ${confidenceStyles[result.confidence]}`}
                      >
                        {t.result.confidenceLabels[result.confidence]}
                      </Badge>
                    </div>
                    <p className="mt-4 text-sm text-slate-500">
                      {t.result.confidenceNote}
                    </p>
                  </div>
                </div>

                <div className="panel-surface flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-3">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f1e9d7] text-[#163d2b]">
                      <History className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-950">
                        {historyMsg ?? t.result.historySaved}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">{t.result.savePdfHint}</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={() =>
                      openPrintableReport({
                        t,
                        locale: t.locale,
                        result,
                        form,
                        materials,
                      })
                    }
                    className="h-11 rounded-full bg-[#163d2b] px-5 text-white hover:bg-[#112d20]"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {t.result.downloadPdf}
                  </Button>
                </div>

                <div className="panel-surface p-7">
                  <p className="section-kicker">{t.result.analysisEyebrow}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                    {t.result.analysisTitle}
                  </h3>
                  <p className="mt-5 text-base leading-8 text-slate-700">{result.analysis}</p>
                </div>

                <div className="panel-surface p-7">
                  <p className="section-kicker">{t.result.factorsEyebrow}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                    {t.result.factorsTitle}
                  </h3>

                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {result.factors.map(factor => (
                      <div
                        key={factor.name}
                        className={`rounded-[22px] border p-5 ${impactStyles[factor.impact]}`}
                      >
                        <p className="text-xs uppercase tracking-[0.24em] opacity-70">
                          {factor.name}
                        </p>
                        <p className="mt-3 text-sm font-medium leading-7">{factor.value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
