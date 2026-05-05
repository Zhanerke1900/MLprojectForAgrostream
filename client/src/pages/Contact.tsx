import { SectionIntro, SiteShell } from "@/components/site/SiteShell";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage, type Language } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  BadgeCheck,
  Clock3,
  Mail,
  MapPin,
  MessagesSquare,
  Phone,
  Send,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";

const contactCopy: Record<Language, any> = {
  ru: {
    cards: [
      {
        icon: Mail,
        title: "Email",
        lines: ["info@agrostream.net", "Разбор карт поля, сезонных данных и сценария оценки"],
      },
      {
        icon: Phone,
        title: "Телефон",
        lines: ["8 705 440 26 01", "Связь с командой в рабочее время"],
      },
      {
        icon: MapPin,
        title: "Адрес",
        lines: ['г. Астана, БЦ "Нурсаулет 2"', "Казахстан"],
      },
      {
        icon: Clock3,
        title: "Формат работы",
        lines: ["Онлайн-разбор по записи", "Рабочие встречи для агрономов и руководителей"],
      },
    ],
    flow: [
      "Сначала фиксируем, какие материалы уже есть: карта урожайности, карточка поля, сезонные данные или часть документов.",
      "Затем определяем, какие сведения можно использовать сразу и каких показателей не хватает для расчета.",
      "После этого показываем, как собрать рабочий сценарий оценки по конкретному полю.",
      "В финале согласовываем следующий шаг: разбор данных, пилот или подготовку дополнительных материалов.",
    ],
    hero: {
      eyebrow: "Контакты",
      title:
        "Если хотите, можем разобрать ваши материалы и оценить, какие данные уже готовы к работе.",
      description:
        "Эта страница полезна, если у вас есть карта урожайности, карточка поля, сезонные показатели или только часть информации, и нужно понять следующий практический шаг.",
      bullets: [
        "Понять, что можно взять из ваших карт и документов.",
        "Разделить полевой контекст и недостающие численные показатели.",
        "Собрать понятный сценарий оценки по конкретному полю.",
        "Определить, какие данные нужны для более сильной модели в будущем.",
      ],
      primary: "Сначала открыть оценку",
      secondary: "Как это работает",
    },
    processIntro: {
      eyebrow: "Как проходит разбор",
      title: "Рабочий разговор начинается с состава данных",
      description:
        "Мы обсуждаем результат после того, как понятны исходные материалы. Так проще увидеть, где оценка уже применима, а где нужна дополнительная информация.",
    },
    discuss: {
      title: "Что можно обсудить",
      subtitle: "На что полезнее всего потратить демо",
      points: [
        "Какая часть информации уже есть в карте урожайности и карточке поля.",
        "Каких сезонных данных не хватает для более надежной оценки.",
        "Как превратить текущий сценарий в продукт на фактических полевых данных.",
      ],
    },
    form: {
      eyebrow: "Форма заявки",
      title: "Оставьте заявку на разбор материалов или консультацию",
      successTitle: "Заявка отправлена",
      successText:
        "Спасибо. Команда вернется к вам, чтобы обсудить данные, страну, площадь и удобный формат следующего шага.",
      fullName: "ФИО",
      fullNamePlaceholder: "Алия Омарова",
      email: "Email",
      phone: "Телефон",
      company: "Компания",
      companyPlaceholder: "Например: агрохолдинг или внутренняя агрокоманда",
      country: "Страна",
      countryPlaceholder: "Казахстан",
      area: "Площадь",
      areaPlaceholder: "Например: 291,2 га",
      submit: "Отправить заявку",
      sending: "Отправляем...",
      error:
        "Не удалось сохранить заявку. Проверьте данные и попробуйте еще раз.",
    },
    stepLabel: "Этап",
  },
  en: {
    cards: [
      {
        icon: Mail,
        title: "Email",
        lines: ["info@agrostream.net", "Review of field maps, seasonal data, and assessment scenarios"],
      },
      {
        icon: Phone,
        title: "Phone",
        lines: ["8 705 440 26 01", "Contact the team during business hours"],
      },
      {
        icon: MapPin,
        title: "Address",
        lines: ['Astana, BC "Nursaulet 2"', "Kazakhstan"],
      },
      {
        icon: Clock3,
        title: "Work format",
        lines: ["Scheduled online review", "Working sessions for agronomists and managers"],
      },
    ],
    flow: [
      "First, we record what materials you already have: a yield map, field profile, seasonal data, or partial documents.",
      "Then we define which information can be used immediately and which indicators are missing for the calculation.",
      "After that, we show how to build a working assessment scenario for a specific field.",
      "Finally, we agree on the next step: data review, pilot, or preparation of additional materials.",
    ],
    hero: {
      eyebrow: "Contacts",
      title:
        "If you want, we can review your materials and assess which data is already ready for work.",
      description:
        "This page is useful if you have a yield map, field profile, seasonal indicators, or only part of the information and need to define the next practical step.",
      bullets: [
        "Understand what can be taken from your maps and documents.",
        "Separate field context from missing numeric indicators.",
        "Build a clear assessment scenario for a specific field.",
        "Define which data is needed for a stronger model later.",
      ],
      primary: "Open assessment first",
      secondary: "How it works",
    },
    processIntro: {
      eyebrow: "Review process",
      title: "A working conversation starts with the data set",
      description:
        "We discuss the result after the source materials are clear. This makes it easier to see where the assessment is already useful and where more information is needed.",
    },
    discuss: {
      title: "What we can discuss",
      subtitle: "The most useful focus for a demo",
      points: [
        "What information is already present in the yield map and field profile.",
        "Which seasonal data is missing for a more reliable estimate.",
        "How to turn the current scenario into a product based on actual field data.",
      ],
    },
    form: {
      eyebrow: "Request form",
      title: "Leave a request for material review or consultation",
      successTitle: "Request sent",
      successText:
        "Thank you. The team will get back to you to discuss the data, country, area, and the best format for the next step.",
      fullName: "Full name",
      fullNamePlaceholder: "Aliya Omarova",
      email: "Email",
      phone: "Phone",
      company: "Company",
      companyPlaceholder: "For example: agricultural holding or internal agronomy team",
      country: "Country",
      countryPlaceholder: "Kazakhstan",
      area: "Area",
      areaPlaceholder: "For example: 291.2 ha",
      submit: "Send request",
      sending: "Sending...",
      error: "Could not save the request. Please check the data and try again.",
    },
    stepLabel: "Step",
  },
};

export default function Contact() {
  const { language } = useLanguage();
  const t = contactCopy[language];
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    country: "",
    area: "",
  });
  const [submitted, setSubmitted] = useState(false);
  const [requestError, setRequestError] = useState<string | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const createContactRequest = trpc.contact.createRequest.useMutation();

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setRequestError(null);

    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    try {
      await createContactRequest.mutateAsync({
        ...formData,
        language,
      });

      setSubmitted(true);
      setFormData({
        fullName: "",
        email: "",
        phone: "",
        company: "",
        country: "",
        area: "",
      });

      timeoutRef.current = window.setTimeout(() => {
        setSubmitted(false);
      }, 3200);
    } catch (error) {
      console.error(error);
      setRequestError(t.form.error);
    }
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 pb-10 pt-14 lg:pt-18">
        <div className="grid gap-6 lg:grid-cols-[1.02fr_0.98fr]">
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
              <Link href="/about">
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
              eyebrow={t.processIntro.eyebrow}
              title={t.processIntro.title}
              description={t.processIntro.description}
              tone="dark"
            />

            <div className="mt-8 space-y-4">
              {t.flow.map((item: string, index: number) => (
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
        <div className="grid gap-6 lg:grid-cols-[0.88fr_1.12fr]">
          <div className="space-y-5">
            {t.cards.map((item: any) => {
              const Icon = item.icon;

              return (
                <Card key={item.title} className="panel-surface rounded-[30px] border-none shadow-none">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#163d2b] text-[#d8b26b]">
                        <Icon className="h-5 w-5" />
                      </span>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-950">{item.title}</h3>
                        <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
                          {item.lines.map((line: string) => (
                            <p key={line}>{line}</p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            <div className="panel-surface p-6">
              <div className="flex items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f1e8d6] text-[#163d2b]">
                  <Users className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="text-lg font-semibold text-slate-950">{t.discuss.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{t.discuss.subtitle}</p>
                </div>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-7 text-slate-600">
                {t.discuss.points.map((point: string) => (
                  <p key={point}>{point}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="panel-surface p-7 sm:p-8">
            <div className="flex items-center gap-4">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#163d2b] text-[#d8b26b]">
                <Send className="h-5 w-5" />
              </span>
              <div>
                <p className="section-kicker">{t.form.eyebrow}</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">
                  {t.form.title}
                </h2>
              </div>
            </div>

            <div className="mt-6">
              {submitted ? (
                <div className="rounded-[28px] border border-emerald-700/12 bg-emerald-50 p-6">
                  <div className="flex items-start gap-3">
                    <MessagesSquare className="mt-1 h-5 w-5 text-[#1d5a3f]" />
                    <div>
                      <p className="text-lg font-semibold text-[#163d2b]">{t.form.successTitle}</p>
                      <p className="mt-2 text-sm leading-7 text-[#365541]">
                        {t.form.successText}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">
                        {t.form.fullName}
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        required
                        className="mt-2 h-12 rounded-2xl border-slate-900/8 bg-white/85"
                        placeholder={t.form.fullNamePlaceholder}
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                        {t.form.email}
                      </Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="mt-2 h-12 rounded-2xl border-slate-900/8 bg-white/85"
                        placeholder="team@company.kz"
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-slate-700">
                        {t.form.phone}
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="mt-2 h-12 rounded-2xl border-slate-900/8 bg-white/85"
                        placeholder="+7 (700) 000-00-00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="company" className="text-sm font-medium text-slate-700">
                        {t.form.company}
                      </Label>
                      <Input
                        id="company"
                        name="company"
                        value={formData.company}
                        onChange={handleInputChange}
                        className="mt-2 h-12 rounded-2xl border-slate-900/8 bg-white/85"
                        placeholder={t.form.companyPlaceholder}
                      />
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label htmlFor="country" className="text-sm font-medium text-slate-700">
                        {t.form.country}
                      </Label>
                      <Input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleInputChange}
                        required
                        className="mt-2 h-12 rounded-2xl border-slate-900/8 bg-white/85"
                        placeholder={t.form.countryPlaceholder}
                      />
                    </div>
                    <div>
                      <Label htmlFor="area" className="text-sm font-medium text-slate-700">
                        {t.form.area}
                      </Label>
                      <Input
                        id="area"
                        name="area"
                        value={formData.area}
                        onChange={handleInputChange}
                        required
                        className="mt-2 h-12 rounded-2xl border-slate-900/8 bg-white/85"
                        placeholder={t.form.areaPlaceholder}
                      />
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={createContactRequest.isPending}
                    className="h-12 w-full rounded-full bg-[#163d2b] text-white hover:bg-[#112d20]"
                  >
                    {createContactRequest.isPending ? t.form.sending : t.form.submit}
                  </Button>

                  {requestError ? (
                    <div className="rounded-[20px] border border-red-500/12 bg-red-50 p-4 text-sm text-red-700">
                      {requestError}
                    </div>
                  ) : null}
                </form>
              )}
            </div>
          </div>
        </div>
      </section>
    </SiteShell>
  );
}
