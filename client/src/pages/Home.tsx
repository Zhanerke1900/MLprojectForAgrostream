import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { SectionIntro, SiteShell } from "@/components/site/SiteShell";
import { useLanguage, type Language } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  CalendarRange,
  CloudRain,
  Droplets,
  FileImage,
  Leaf,
  Map,
  ShieldCheck,
  Sprout,
  Thermometer,
  TrendingUp,
  Users,
  Workflow,
} from "lucide-react";
import { Link } from "wouter";

const homeCopy: Record<Language, any> = {
  ru: {
    hero: {
      eyebrow: "Разбор поля и сезона",
      title:
        "Field Review помогает оценить потенциал урожайности по полевым материалам и сезонным данным.",
      description:
        "Карточка поля и карта урожайности задают контекст. СЭТ, осадки и гумус добавляют расчетную основу, чтобы команда получила рабочий диапазон и факторы влияния.",
      primaryCta: "Открыть оценку поля",
      secondaryCta: "Посмотреть методику",
      chips: ["Карточка поля", "Карта урожайности", "СЭТ", "Осадки", "Гумус"],
      panelEyebrow: "Что уже есть",
      panelBadge: "Поле 2025",
      panelTitle:
        "Материалы задают контекст, сезонные показатели уточняют расчет",
      panelDescription:
        "Сервис разделяет сведения, полученные из ваших материалов, и показатели, которые вводятся вручную для расчетной оценки.",
      panelResultEyebrow: "Что получает команда",
      panelResultTitle:
        "Диапазон урожайности, уровень надежности и факторы влияния",
      panelInputLabel: "3 численных ввода",
      panelBullets: [
        "Карточка поля фиксирует культуру, сорт, площадь, даты и предшественник.",
        "Карта урожайности показывает неоднородность поля и помогает читать результат в контексте.",
        "СЭТ, осадки и гумус формируют расчетную основу сезонной оценки.",
      ],
    },
    metrics: [
      {
        value: "291,2 га",
        label: "Площадь поля",
        note:
          "Оценка привязана к конкретному полю, а не к абстрактному демо-сценарию.",
      },
      {
        value: "1 карта",
        label: "Карта урожайности",
        note:
          "Карта дает контекст неоднородности и помогает корректно читать итоговый диапазон.",
      },
      {
        value: "3 показателя",
        label: "Основа расчета",
        note:
          "СЭТ, осадки за вегетацию и гумус дают численную базу для оценки.",
      },
      {
        value: "1 отчет",
        label: "Рабочий результат",
        note:
          "На выходе команда получает диапазон урожайности, пояснение и факторы влияния.",
      },
    ],
    fieldContext: [
      "Пшеница мягкая яровая",
      "Сорт Нерда",
      "Репродукция Первая",
      "Предшественник Лён",
      "Площадь 291,2 га",
      "Посев 19-20.05.2025",
      "Уборка 20-21.09.2025",
      "Карта урожайности 2025",
    ],
    extractedIntro: {
      eyebrow: "Что можно взять из материалов",
      title: "Полевые документы помогают собрать исходный профиль поля",
      description:
        "Изображения, карты и карточки полезны как источник контекста. Для численной оценки они дополняются сезонными показателями.",
    },
    extractedFromMaterials: [
      {
        icon: Map,
        title: "Паспорт поля",
        text:
          "Культура, сорт, площадь, предшественник и даты сезона фиксируются в одном профиле.",
      },
      {
        icon: CalendarRange,
        title: "Контекст сезона",
        text:
          "Становится понятно, к какому периоду относится поле и какой цикл работ оценивается.",
      },
      {
        icon: CloudRain,
        title: "Зоны неоднородности",
        text:
          "Карта урожайности показывает, что поле нельзя сводить к одному числу без пояснений.",
      },
      {
        icon: Droplets,
        title: "Данные для уточнения",
        text:
          "Сразу видно, какие показатели нужны для расчета: например гумус, СЭТ или осадки за вегетацию.",
      },
    ],
    logicIntro: {
      eyebrow: "Логика расчета",
      title:
        "Оценка становится полезной, когда контекст дополняется численными данными",
      description:
        "Основной сценарий построен вокруг сочетания карточки поля, карты урожайности и нескольких параметров сезона.",
    },
    modules: [
      {
        icon: FileImage,
        title: "Материалы поля",
        description:
          "Карта и карточка поля фиксируют культуру, сорт, предшественник, площадь, даты и общий контекст сезона.",
      },
      {
        icon: Thermometer,
        title: "Сезонные показатели",
        description:
          "СЭТ, осадки за вегетацию и гумус добавляют расчету численную основу.",
      },
      {
        icon: TrendingUp,
        title: "Агрономическая оценка",
        description:
          "Сервис рассчитывает сценарную оценку потенциала урожайности по полю и сезону.",
      },
      {
        icon: Workflow,
        title: "Вывод для команды",
        description:
          "Результат приходит в формате для обсуждения: диапазон, надежность и краткое пояснение.",
      },
    ],
    workflowIntro: {
      eyebrow: "Как работает сервис",
      title: "От полевых материалов к рабочей оценке сезона",
      description:
        "Сценарий короткий: фиксируем исходные материалы, добавляем сезонные показатели и получаем итог для обсуждения.",
    },
    stages: [
      {
        step: "01",
        title: "Фиксируем исходные данные",
        description:
          "Карточка поля и карта урожайности задают начальный контекст: поле, культура, сезон и предшественник.",
      },
      {
        step: "02",
        title: "Добавляем сезонные показатели",
        description:
          "Агроном вносит СЭТ, осадки за вегетацию и гумус при наличии подтвержденного значения.",
      },
      {
        step: "03",
        title: "Получаем расчетный диапазон",
        description:
          "Сервис возвращает среднюю оценку, диапазон урожайности, факторы влияния и уровень надежности.",
      },
      {
        step: "04",
        title: "Используем результат в работе",
        description:
          "Итог помогает согласовать ожидания между агрономом, аналитиком и руководителем.",
      },
    ],
    rolesIntro: {
      eyebrow: "Для кого это",
      title: "Оценка читается одинаково всеми участниками процесса",
      description:
        "Страница дает общий язык для обсуждения поля, сезона и управленческого решения.",
    },
    roles: [
      {
        icon: Users,
        title: "Для руководителя",
        description:
          "Видно, какой уровень урожайности обсуждать по полю и насколько надежен текущий сценарий сезона.",
      },
      {
        icon: Leaf,
        title: "Для агронома",
        description:
          "Понятно, как сезонные показатели влияют на результат и какие ограничения требуют внимания.",
      },
      {
        icon: Workflow,
        title: "Для аналитика",
        description:
          "Поле, сезон и вывод можно собрать в один экран с понятной структурой исходных данных.",
      },
    ],
    valueIntro: {
      eyebrow: "Практическая ценность",
      title: "Сервис показывает не только результат, но и основу расчета",
      description:
        "Такой подход помогает понимать качество исходных данных и принимать решение без завышенных ожиданий.",
    },
    insights: [
      {
        tag: "Данные",
        title: "Карты и изображения полезны как контекст",
        description:
          "Они помогают понять поле, сезон и неоднородность, но численный вывод строится с учетом сезонных показателей.",
      },
      {
        tag: "Практика",
        title: "Разрозненные материалы собираются в один сценарий",
        description:
          "Карточка поля, карта урожайности и ручной ввод объединяются в рабочую оценку для команды.",
      },
      {
        tag: "Ограничения",
        title: "Оценка не заменяет лабораторию и историческую модель",
        description:
          "Она дает аккуратный расчет по доступным данным и показывает, что стоит собрать дальше.",
      },
    ],
    cta: {
      eyebrow: "Следующий шаг",
      title:
        "Перейдите к оценке поля и посмотрите, как контекст превращается в рабочий вывод",
      description:
        "На следующем экране видно, что берется из материалов, что вводится вручную и как появляется итоговая оценка сезона.",
      primary: "Перейти к оценке",
      secondary: "Обсудить свои данные",
    },
    stageLabel: "Этап",
  },
  en: {
    hero: {
      eyebrow: "Field and season review",
      title:
        "Field Review helps assess yield potential from field materials and seasonal data.",
      description:
        "The field profile and yield map define the context. GDD, precipitation, and humus add the calculation basis for a working range and key drivers.",
      primaryCta: "Open field assessment",
      secondaryCta: "View method",
      chips: ["Field profile", "Yield map", "GDD", "Precipitation", "Humus"],
      panelEyebrow: "Available inputs",
      panelBadge: "Field 2025",
      panelTitle: "Materials define context, seasonal indicators refine the estimate",
      panelDescription:
        "The service separates data extracted from your materials from indicators entered manually for the calculated assessment.",
      panelResultEyebrow: "Team output",
      panelResultTitle: "Yield range, confidence level, and key drivers",
      panelInputLabel: "3 numeric inputs",
      panelBullets: [
        "The field profile records crop, variety, area, dates, and predecessor.",
        "The yield map shows field variability and helps interpret the final range.",
        "GDD, precipitation, and humus provide the calculation basis for the seasonal assessment.",
      ],
    },
    metrics: [
      {
        value: "291.2 ha",
        label: "Field area",
        note: "The assessment is tied to a real field, not an abstract demo scenario.",
      },
      {
        value: "1 map",
        label: "Yield map",
        note: "The map provides variability context and helps interpret the final range.",
      },
      {
        value: "3 indicators",
        label: "Calculation basis",
        note: "GDD, vegetation-period precipitation, and humus form the numeric basis.",
      },
      {
        value: "1 report",
        label: "Working result",
        note: "The team receives a yield range, explanation, and key influence factors.",
      },
    ],
    fieldContext: [
      "Spring soft wheat",
      "Nerda variety",
      "First reproduction",
      "Predecessor: flax",
      "Area 291.2 ha",
      "Sowing 19-20.05.2025",
      "Harvest 20-21.09.2025",
      "Yield map 2025",
    ],
    extractedIntro: {
      eyebrow: "What materials provide",
      title: "Field documents help build the initial field profile",
      description:
        "Images, maps, and field records are useful as context. For a numeric estimate, they are combined with seasonal indicators.",
    },
    extractedFromMaterials: [
      {
        icon: Map,
        title: "Field profile",
        text:
          "Crop, variety, area, predecessor, and season dates are recorded in one profile.",
      },
      {
        icon: CalendarRange,
        title: "Season context",
        text:
          "The team can see which period and production cycle the field belongs to.",
      },
      {
        icon: CloudRain,
        title: "Variability zones",
        text:
          "The yield map shows why the field should not be reduced to one number without context.",
      },
      {
        icon: Droplets,
        title: "Data to refine",
        text:
          "The interface makes clear which indicators are needed, such as humus, GDD, or vegetation-period precipitation.",
      },
    ],
    logicIntro: {
      eyebrow: "Assessment logic",
      title: "The estimate becomes useful when context is combined with numeric data",
      description:
        "The core workflow combines the field profile, yield map, and a short list of seasonal parameters.",
    },
    modules: [
      {
        icon: FileImage,
        title: "Field materials",
        description:
          "The map and field profile record crop, variety, predecessor, area, dates, and season context.",
      },
      {
        icon: Thermometer,
        title: "Seasonal indicators",
        description:
          "GDD, vegetation-period precipitation, and humus add numeric support to the assessment.",
      },
      {
        icon: TrendingUp,
        title: "Agronomic assessment",
        description:
          "The service calculates a scenario-based yield potential estimate for the field and season.",
      },
      {
        icon: Workflow,
        title: "Team output",
        description:
          "The result is ready for discussion: range, confidence, and a concise agronomic explanation.",
      },
    ],
    workflowIntro: {
      eyebrow: "How it works",
      title: "From field materials to a working seasonal assessment",
      description:
        "The workflow is concise: record source materials, add seasonal indicators, and receive an output for discussion.",
    },
    stages: [
      {
        step: "01",
        title: "Record source data",
        description:
          "The field profile and yield map define the starting context: field, crop, season, and predecessor.",
      },
      {
        step: "02",
        title: "Add seasonal indicators",
        description:
          "The agronomist enters GDD, vegetation-period precipitation, and humus when a confirmed value is available.",
      },
      {
        step: "03",
        title: "Receive a calculated range",
        description:
          "The service returns the average estimate, yield range, influence factors, and confidence level.",
      },
      {
        step: "04",
        title: "Use the result in work",
        description:
          "The output helps align expectations between the agronomist, analyst, and manager.",
      },
    ],
    rolesIntro: {
      eyebrow: "Who uses it",
      title: "The assessment is readable for every participant in the process",
      description:
        "The page gives the team a shared language for the field, season, and decision.",
    },
    roles: [
      {
        icon: Users,
        title: "For managers",
        description:
          "It is clear which yield level to discuss and how reliable the current seasonal scenario is.",
      },
      {
        icon: Leaf,
        title: "For agronomists",
        description:
          "It is clear how seasonal indicators affect the result and which limits need attention.",
      },
      {
        icon: Workflow,
        title: "For analysts",
        description:
          "Field, season, and conclusion can be presented in one structured screen.",
      },
    ],
    valueIntro: {
      eyebrow: "Practical value",
      title: "The service shows not only the result, but also the basis for it",
      description:
        "This helps the team understand input data quality and make decisions without inflated expectations.",
    },
    insights: [
      {
        tag: "Data",
        title: "Maps and images are useful as context",
        description:
          "They help describe the field, season, and variability, while the numeric estimate uses seasonal indicators.",
      },
      {
        tag: "Practice",
        title: "Scattered materials become one assessment scenario",
        description:
          "The field profile, yield map, and manual inputs are combined into a working estimate for the team.",
      },
      {
        tag: "Limits",
        title: "The estimate does not replace lab work or a historical model",
        description:
          "It provides a careful calculation from available data and shows what should be collected next.",
      },
    ],
    cta: {
      eyebrow: "Next step",
      title:
        "Open the field assessment and see how context becomes a working conclusion",
      description:
        "The next screen shows what is taken from the materials, what is entered manually, and how the seasonal estimate appears.",
      primary: "Go to assessment",
      secondary: "Discuss your data",
    },
    stageLabel: "Stage",
  },
};

export default function Home() {
  const { language } = useLanguage();
  const t = homeCopy[language];

  return (
    <SiteShell>
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-14 sm:pt-18 lg:pb-24 lg:pt-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <Badge className="rounded-full border border-emerald-950/10 bg-white/70 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.28em] text-[#33523f] shadow-sm">
                {t.hero.eyebrow}
              </Badge>

              <h1 className="mt-6 max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.05em] text-slate-950 sm:text-6xl">
                {t.hero.title}
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {t.hero.description}
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href="/forecast">
                  <a
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "rounded-full bg-[#163d2b] px-6 text-white hover:bg-[#112d20]"
                    )}
                  >
                    {t.hero.primaryCta}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Link>
                <Link href="/about">
                  <a
                    className={cn(
                      buttonVariants({ variant: "outline", size: "lg" }),
                      "rounded-full border-emerald-950/10 bg-white/76 px-6 text-slate-700 hover:bg-white hover:text-slate-950"
                    )}
                  >
                    {t.hero.secondaryCta}
                  </a>
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                {t.hero.chips.map((item: string) => (
                  <span
                    key={item}
                    className="rounded-full border border-emerald-950/10 bg-white/60 px-4 py-2 text-sm text-slate-600"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="hero-glow olive-surface rounded-[36px] p-6 text-white sm:p-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Badge className="rounded-full bg-white/10 px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-white">
                  {t.hero.panelEyebrow}
                </Badge>
                <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs uppercase tracking-[0.24em] text-white/60">
                  {t.hero.panelBadge}
                </span>
              </div>

              <h2 className="mt-6 text-3xl font-semibold tracking-tight">
                {t.hero.panelTitle}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-7 text-emerald-50/72">
                {t.hero.panelDescription}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                {t.fieldContext.map((item: string) => (
                  <span
                    key={item}
                    className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-emerald-50/78"
                  >
                    {item}
                  </span>
                ))}
              </div>

              <div className="mt-6 rounded-[28px] border border-white/8 bg-white/7 p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/55">
                      {t.hero.panelResultEyebrow}
                    </p>
                    <p className="mt-2 text-xl font-semibold">
                      {t.hero.panelResultTitle}
                    </p>
                  </div>
                  <div className="rounded-2xl bg-[#d1a25c] px-4 py-3 text-sm font-semibold text-[#102919]">
                    {t.hero.panelInputLabel}
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {t.hero.panelBullets.map((item: string) => (
                    <div key={item} className="flex items-start gap-3 text-sm text-emerald-50/70">
                      <BadgeCheck className="mt-0.5 h-4 w-4 text-[#d8b26b]" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {t.metrics.map((item: { value: string; label: string; note: string }) => (
              <div key={item.label} className="metric-card">
                <p className="text-3xl font-semibold tracking-tight text-slate-950">{item.value}</p>
                <p className="mt-2 text-sm font-medium text-slate-700">{item.label}</p>
                <p className="mt-3 text-sm leading-6 text-slate-500">{item.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <SectionIntro {...t.extractedIntro} />

        <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {t.extractedFromMaterials.map((item: any) => {
            const Icon = item.icon;

            return (
              <div key={item.title} className="panel-surface p-6">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#163d2b] text-[#d8b26b]">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-xl font-semibold text-slate-950">{item.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.text}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <SectionIntro {...t.logicIntro} />

        <div className="mt-10 grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
          {t.modules.map((item: any) => {
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
        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="olive-surface rounded-[36px] p-6 text-white sm:p-8">
            <SectionIntro
              {...t.workflowIntro}
              tone="dark"
              className="max-w-2xl"
            />

            <div className="mt-8 grid gap-4">
              {t.stages.map((item: { step: string; title: string; description: string }) => (
                <div
                  key={item.step}
                  className="rounded-[26px] border border-white/8 bg-white/6 p-5"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-[0.24em] text-[#d8b26b]">
                        {t.stageLabel} {item.step}
                      </p>
                      <h3 className="mt-2 text-xl font-semibold text-white">{item.title}</h3>
                    </div>
                    <ArrowRight className="h-5 w-5 text-white/30" />
                  </div>
                  <p className="mt-3 text-sm leading-7 text-emerald-50/70">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-5">
            <SectionIntro {...t.rolesIntro} />

            {t.roles.map((item: any) => {
              const Icon = item.icon;

              return (
                <div key={item.title} className="panel-surface p-6">
                  <div className="flex items-center gap-4">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f0e9d8] text-[#163d2b]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="text-xl font-semibold text-slate-950">{item.title}</h3>
                  </div>
                  <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <SectionIntro {...t.valueIntro} align="center" />

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {t.insights.map((item: { tag: string; title: string; description: string }) => (
            <article key={item.title} className="panel-surface p-6">
              <div className="flex items-center justify-between gap-4">
                <span className="rounded-full bg-[#f1ebdb] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[#4c6655]">
                  {item.tag}
                </span>
                <ShieldCheck className="h-4 w-4 text-[#d1a25c]" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight text-slate-950">
                {item.title}
              </h3>
              <p className="mt-4 text-sm leading-7 text-slate-600">{item.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 pt-10">
        <div className="olive-surface rounded-[36px] p-7 text-white sm:p-10">
          <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
            <div>
              <p className="section-kicker">{t.cta.eyebrow}</p>
              <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {t.cta.title}
              </h2>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-emerald-50/70 sm:text-base">
                {t.cta.description}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link href="/forecast">
                <a
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "rounded-full bg-[#d1a25c] px-6 text-[#102919] hover:bg-[#c4944a]"
                  )}
                >
                  {t.cta.primary}
                </a>
              </Link>
              <Link href="/contact">
                <a
                  className={cn(
                    buttonVariants({ variant: "outline", size: "lg" }),
                    "rounded-full border-white/12 bg-white/8 px-6 text-white hover:bg-white/14"
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
