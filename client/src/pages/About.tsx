import { SectionIntro, SiteShell } from "@/components/site/SiteShell";
import { buttonVariants } from "@/components/ui/button";
import { useLanguage, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  FileImage,
  Layers3,
  ShieldCheck,
  Sprout,
  Thermometer,
  Workflow,
} from "lucide-react";
import { Link } from "wouter";

const aboutCopy: Record<Language, any> = {
  ru: {
    hero: {
      eyebrow: "Методика",
      title:
        "Сервис строит оценку по структуре данных: поле, сезонные показатели и расчетный сценарий.",
      description:
        "Карты, изображения и документы помогают описать поле. СЭТ, осадки и гумус переводят этот контекст в численную оценку потенциала урожайности.",
      bullets: [
        "По материалам определяется профиль поля и сезон, который рассматривается.",
        "Сезонные показатели показывают, насколько условия поддерживали потенциал культуры.",
        "Итоговая оценка показывает диапазон и факторы влияния, а не одно число без объяснения.",
        "Подход можно усиливать историей полей, анализами почвы и фактической урожайностью.",
      ],
      primary: "Посмотреть оценку",
      secondary: "Обсудить сценарий",
    },
    idea: {
      eyebrow: "Главная идея",
      title: "Платформа показывает, какие данные участвуют в расчете",
      description:
        "Пользователь видит, что пришло из полевых материалов, какие показатели были добавлены вручную и как они влияют на итог.",
      whyLabel: "Почему это полезно",
      whyTitle:
        "Команда понимает ценность исходных данных и ограничения текущей оценки",
      whyText:
        "Такой подход подходит для реальной работы: он помогает понять, чего уже достаточно для обсуждения поля, а какие данные стоит собрать для более уверенной модели.",
    },
    metrics: [
      { value: "1", label: "поле", note: "один понятный рабочий сценарий" },
      { value: "3", label: "показателя", note: "численная основа оценки" },
      { value: "2025", label: "карта урожайности", note: "контекст сезона" },
    ],
    productIntro: {
      eyebrow: "Структура решения",
      title: "Сервис собран как последовательный разбор поля",
      description:
        "Каждый этап добавляет конкретный тип данных и делает итоговую оценку прозрачнее для команды.",
    },
    productModules: [
      {
        icon: FileImage,
        title: "Что дают материалы поля",
        description:
          "Карточка поля и карта урожайности фиксируют культуру, сорт, предшественник, площадь, даты и общую картину сезона.",
      },
      {
        icon: Thermometer,
        title: "Что нужно добавить",
        description:
          "Для расчетной оценки нужны сезонные показатели: минимум СЭТ и осадки, дополнительно гумус.",
      },
      {
        icon: Activity,
        title: "Что считает сервис",
        description:
          "Система строит сценарную агрономическую оценку по полю и сезону, а не изолированный вывод по одному изображению.",
      },
      {
        icon: Workflow,
        title: "Что получает команда",
        description:
          "Итог включает рабочий диапазон урожайности, уровень надежности и краткое пояснение для встречи.",
      },
    ],
    benefitsIntro: {
      eyebrow: "Преимущества",
      title: "Что становится понятнее после такой структуры",
      description:
        "Пользователь видит источник каждого вывода и может быстрее решить, какие данные нужны дальше.",
    },
    benefits: [
      {
        icon: Layers3,
        title: "Понятный источник результата",
        description:
          "В интерфейсе разделены сведения из материалов поля и показатели, введенные как сезонные данные.",
      },
      {
        icon: ShieldCheck,
        title: "Ясные ограничения",
        description:
          "Сервис не скрывает, что без сезонных чисел оценка будет менее надежной.",
      },
      {
        icon: Sprout,
        title: "База для развития",
        description:
          "Сценарий можно расширять: добавлять новые поля, историю сезонов, анализы почвы и фактическую урожайность.",
      },
    ],
    rolloutIntro: {
      eyebrow: "Дальнейший путь",
      title: "Как текущий сценарий превращается в более сильный продукт",
      description:
        "Сегодня сервис дает полезную оценку по доступным данным. Дальше ее можно усиливать накопленной историей и проверкой по факту.",
    },
    rollout: [
      {
        step: "01",
        title: "Собрать полевой контекст",
        description:
          "Сначала определяется, что реально есть в исходных материалах: поле, сезон, площадь, культура и карта урожайности.",
      },
      {
        step: "02",
        title: "Заполнить сезонные показатели",
        description:
          "Агроном добавляет значения, без которых материалы не превращаются в расчет: СЭТ, осадки и гумус при наличии.",
      },
      {
        step: "03",
        title: "Сформировать оценку",
        description:
          "Сервис собирает рабочий диапазон урожайности и коротко объясняет, почему сценарий выглядит именно так.",
      },
      {
        step: "04",
        title: "Сверять с фактом",
        description:
          "Следующий этап развития — накапливать реальные результаты по полям и улучшать оценку на фактических данных.",
      },
    ],
    cta: {
      eyebrow: "Следующий шаг",
      title: "Перейдите на страницу оценки и посмотрите методику на одном поле",
      description:
        "Там разделены контекст из материалов и те показатели, которые необходимы для расчета сезона.",
      primary: "Перейти к оценке",
      secondary: "Задать вопрос по данным",
    },
    stepLabel: "Шаг",
  },
  en: {
    hero: {
      eyebrow: "Method",
      title:
        "The service builds the assessment from data structure: field, seasonal indicators, and calculation scenario.",
      description:
        "Maps, images, and documents describe the field. GDD, precipitation, and humus turn that context into a numeric yield-potential assessment.",
      bullets: [
        "Materials define the field profile and the season under review.",
        "Seasonal indicators show how conditions supported crop potential.",
        "The output shows a range and key drivers, not a single unexplained number.",
        "The approach can be strengthened with field history, soil tests, and actual yields.",
      ],
      primary: "View assessment",
      secondary: "Discuss scenario",
    },
    idea: {
      eyebrow: "Main idea",
      title: "The platform shows which data participates in the calculation",
      description:
        "The user can see what came from field materials, which indicators were added manually, and how they influence the result.",
      whyLabel: "Why it matters",
      whyTitle:
        "The team understands the value of source data and the limits of the current estimate",
      whyText:
        "This approach fits practical work: it shows what is already enough for field discussion and what should be collected for a more confident model.",
    },
    metrics: [
      { value: "1", label: "field", note: "one clear working scenario" },
      { value: "3", label: "indicators", note: "numeric basis of the estimate" },
      { value: "2025", label: "yield map", note: "season context" },
    ],
    productIntro: {
      eyebrow: "Solution structure",
      title: "The service is built as a sequential field review",
      description:
        "Each stage adds a specific data type and makes the final assessment clearer for the team.",
    },
    productModules: [
      {
        icon: FileImage,
        title: "What field materials provide",
        description:
          "The field profile and yield map record crop, variety, predecessor, area, dates, and overall season context.",
      },
      {
        icon: Thermometer,
        title: "What must be added",
        description:
          "A calculated estimate needs seasonal indicators: at minimum GDD and precipitation, with humus as an additional input.",
      },
      {
        icon: Activity,
        title: "What the service calculates",
        description:
          "The system builds a scenario-based agronomic assessment for the field and season, not an isolated conclusion from one image.",
      },
      {
        icon: Workflow,
        title: "What the team receives",
        description:
          "The output includes a working yield range, confidence level, and a concise explanation for a meeting.",
      },
    ],
    benefitsIntro: {
      eyebrow: "Benefits",
      title: "What becomes clearer with this structure",
      description:
        "The user sees the source of each conclusion and can quickly decide which data is needed next.",
    },
    benefits: [
      {
        icon: Layers3,
        title: "Clear source of the result",
        description:
          "The interface separates information from field materials and indicators entered as seasonal data.",
      },
      {
        icon: ShieldCheck,
        title: "Clear limitations",
        description:
          "The service makes it clear that without seasonal numbers, the assessment will be less reliable.",
      },
      {
        icon: Sprout,
        title: "Foundation for growth",
        description:
          "The scenario can be expanded with new fields, season history, soil tests, and actual yields.",
      },
    ],
    rolloutIntro: {
      eyebrow: "Next path",
      title: "How the current scenario becomes a stronger product",
      description:
        "Today the service provides a useful estimate from available data. Later it can be strengthened with accumulated history and validation against actual results.",
    },
    rollout: [
      {
        step: "01",
        title: "Collect field context",
        description:
          "First, the service identifies what is actually present in the source materials: field, season, area, crop, and yield map.",
      },
      {
        step: "02",
        title: "Fill seasonal indicators",
        description:
          "The agronomist adds values that turn materials into a calculation: GDD, precipitation, and humus when available.",
      },
      {
        step: "03",
        title: "Generate the assessment",
        description:
          "The service creates a working yield range and briefly explains why the scenario looks this way.",
      },
      {
        step: "04",
        title: "Compare with actual results",
        description:
          "The next development stage is to accumulate real field outcomes and improve the assessment on factual data.",
      },
    ],
    cta: {
      eyebrow: "Next step",
      title: "Open the assessment page and see the method on one field",
      description:
        "There, the material-based context is separated from the indicators required for the seasonal calculation.",
      primary: "Go to assessment",
      secondary: "Ask about data",
    },
    stepLabel: "Step",
  },
};

export default function About() {
  const { language } = useLanguage();
  const t = aboutCopy[language];

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-14 lg:pt-18">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="panel-surface p-7 sm:p-9">
            <SectionIntro
              eyebrow={t.hero.eyebrow}
              title={t.hero.title}
              description={t.hero.description}
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {t.hero.bullets.map((item: string) => (
                <div key={item} className="field-shell">
                  <div className="flex items-start gap-3 text-sm leading-7 text-slate-700">
                    <BadgeCheck className="mt-1 h-4 w-4 text-[#1d5a3f]" />
                    <span>{item}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/forecast">
                <a
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "rounded-full bg-[#163d2b] px-6 text-white hover:bg-[#112d20]"
                  )}
                >
                  {t.hero.primary}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Link>
              <Link href="/contact">
                <a
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-full border-emerald-950/10 bg-white px-6 text-slate-700 hover:bg-[#f8f5ed]"
                  )}
                >
                  {t.hero.secondary}
                </a>
              </Link>
            </div>
          </div>

          <div className="olive-surface rounded-[36px] p-7 text-white sm:p-9">
            <SectionIntro
              eyebrow={t.idea.eyebrow}
              title={t.idea.title}
              description={t.idea.description}
              tone="dark"
            />

            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {t.metrics.map((item: { value: string; label: string; note: string }) => (
                <div key={item.label} className="rounded-[26px] border border-white/8 bg-white/6 p-5">
                  <p className="text-3xl font-semibold tracking-tight text-white">{item.value}</p>
                  <p className="mt-2 text-sm font-medium text-white">{item.label}</p>
                  <p className="mt-3 text-sm leading-6 text-emerald-50/68">{item.note}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-[28px] border border-white/8 bg-white/6 p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-[#d8b26b]">
                  <ShieldCheck className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-xs uppercase tracking-[0.22em] text-white/55">
                    {t.idea.whyLabel}
                  </p>
                  <p className="mt-1 font-semibold text-white">{t.idea.whyTitle}</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-7 text-emerald-50/70">
                {t.idea.whyText}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <SectionIntro {...t.productIntro} />

        <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {t.productModules.map((item: any) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="panel-surface p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#163d2b] text-[#d8b26b]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1.05fr]">
          <div className="space-y-5">
            <SectionIntro {...t.benefitsIntro} />

            {t.benefits.map((item: any) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="panel-surface p-6">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0e8d7] text-[#163d2b]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>

          <div className="olive-surface rounded-[36px] p-7 text-white sm:p-8">
            <SectionIntro
              {...t.rolloutIntro}
              tone="dark"
            />

            <div className="mt-8 space-y-4">
              {t.rollout.map((item: { step: string; title: string; description: string }) => (
                <div
                  key={item.step}
                  className="rounded-[26px] border border-white/8 bg-white/6 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.24em] text-[#d8b26b]">
                    {t.stepLabel} {item.step}
                  </p>
                  <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
                  <p className="mt-3 text-sm leading-7 text-emerald-50/70">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 pt-10">
        <div className="panel-surface p-7 sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="section-kicker">{t.cta.eyebrow}</p>
              <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
                {t.cta.title}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
                {t.cta.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/forecast">
                <a
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "rounded-full bg-[#163d2b] px-6 text-white hover:bg-[#112d20]"
                  )}
                >
                  {t.cta.primary}
                </a>
              </Link>
              <Link href="/contact">
                <a
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-full border-emerald-950/10 bg-white px-6 text-slate-700 hover:bg-[#f8f5ed]"
                  )}
                >
                  {t.cta.secondary}
                </a>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
