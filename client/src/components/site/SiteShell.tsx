import { buttonVariants } from "@/components/ui/button";
import { useLanguage, type Language } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  Building2,
  Languages,
  LogIn,
  LogOut,
  Mail,
  MapPinned,
  Sprout,
  Workflow,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

const shellCopy: Record<
  Language,
  {
    navigation: Array<{ href: string; label: string }>;
    topLine: string;
    topTags: string[];
    brandSubtitle: string;
    languageLabel: string;
    positioning: string;
    contactCta: string;
    forecastCta: string;
    footer: {
      brandSubtitle: string;
      description: string;
      solutionTitle: string;
      solutionLinks: Array<{ href: string; label: string }>;
      sectionsTitle: string;
      sectionLinks: Array<{ href: string; label: string }>;
      contactsTitle: string;
      team: string;
      address: string;
      workScope: string;
      copyright: string;
      note: string;
    };
  }
> = {
  ru: {
    navigation: [
      { href: "/", label: "Главная" },
      { href: "/forecast", label: "Оценка поля" },
      { href: "/about", label: "Методика" },
      { href: "/contact", label: "Контакты" },
      { href: "/admin", label: "Админ" },
    ],
    topLine:
      "Полевые материалы, сезонные показатели и расчет урожайности в одном интерфейсе.",
    topTags: ["Паспорт поля", "Сезонные показатели", "Казахстан"],
    brandSubtitle: "Разбор поля и сезона",
    languageLabel: "Язык сайта",
    positioning: "Оценка на основе полевых и сезонных данных",
    contactCta: "Связаться",
    forecastCta: "Открыть оценку",
    footer: {
      brandSubtitle: "Разбор поля и сезона",
      description:
        "Сервис объединяет карточку поля, карту урожайности и сезонные показатели, чтобы команда получила понятную агрономическую оценку с видимыми исходными данными.",
      solutionTitle: "Решение",
      solutionLinks: [
        { href: "/about", label: "Что берется из материалов" },
        { href: "/forecast", label: "Оценка поля" },
        { href: "/contact", label: "Разобрать ваши данные" },
      ],
      sectionsTitle: "Разделы",
      sectionLinks: [
        { href: "/", label: "Главная страница" },
        { href: "/about", label: "Методика" },
        { href: "/contact", label: "Связаться с командой" },
        { href: "/admin", label: "Заявки и история" },
      ],
      contactsTitle: "Контакты",
      team: "Команда цифровых решений для агробизнеса",
      address: 'г. Астана, БЦ "Нурсаулет 2"',
      workScope: "Разбор карт поля, сезонных данных и расчетного сценария",
      copyright:
        "Полевой контекст, сезонные показатели и рабочая оценка в одном месте.",
      note:
        "Карточка поля объясняет контекст, а итоговая оценка строится по данным сезона.",
    },
  },
  en: {
    navigation: [
      { href: "/", label: "Home" },
      { href: "/forecast", label: "Field Assessment" },
      { href: "/about", label: "Method" },
      { href: "/contact", label: "Contacts" },
      { href: "/admin", label: "Admin" },
    ],
    topLine:
      "Field records, seasonal indicators, and yield assessment in one interface.",
    topTags: ["Field profile", "Seasonal indicators", "Kazakhstan"],
    brandSubtitle: "Field and season review",
    languageLabel: "Site language",
    positioning: "Assessment based on field and seasonal data",
    contactCta: "Contact us",
    forecastCta: "Open assessment",
    footer: {
      brandSubtitle: "Field and season review",
      description:
        "The service combines a field profile, a yield map, and seasonal indicators so the team receives a clear agronomic assessment with visible input data.",
      solutionTitle: "Solution",
      solutionLinks: [
        { href: "/about", label: "What the materials provide" },
        { href: "/forecast", label: "Field assessment" },
        { href: "/contact", label: "Review your data" },
      ],
      sectionsTitle: "Sections",
      sectionLinks: [
        { href: "/", label: "Home page" },
        { href: "/about", label: "Method" },
        { href: "/contact", label: "Contact the team" },
        { href: "/admin", label: "Requests and history" },
      ],
      contactsTitle: "Contacts",
      team: "Digital solutions team for agribusiness",
      address: 'Astana, BC "Nursaulet 2"',
      workScope: "Review of field maps, seasonal data, and assessment scenarios",
      copyright: "Field context, seasonal indicators, and assessment in one place.",
      note:
        "The field profile explains the context, while the final assessment is built from seasonal data.",
    },
  },
};

type SiteShellProps = {
  children: ReactNode;
};

type PublicShellUser = {
  email: string | null;
  name: string | null;
  role: "user" | "admin";
};

type SectionIntroProps = {
  eyebrow: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  tone?: "light" | "dark";
  className?: string;
};

export function SiteShell({ children }: SiteShellProps) {
  const authQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const user = authQuery.data ?? null;
  const isAdmin = user?.role === "admin";

  return (
    <div className="page-shell min-h-screen text-slate-900">
      <SiteHeader user={user} authLoading={authQuery.isLoading} />
      <main className="relative z-10">{children}</main>
      <SiteFooter isAdmin={isAdmin} />
    </div>
  );
}

export function SectionIntro({
  eyebrow,
  title,
  description,
  align = "left",
  tone = "light",
  className,
}: SectionIntroProps) {
  return (
    <div
      className={cn(
        "max-w-3xl",
        align === "center" && "mx-auto text-center",
        className
      )}
    >
      <span
        className={cn(
          "section-kicker",
          tone === "dark" &&
            "text-emerald-50/60 before:bg-[linear-gradient(90deg,rgba(255,255,255,0.06),rgba(209,162,92,0.8))]"
        )}
      >
        {eyebrow}
      </span>
      <h2
        className={cn(
          "mt-5 text-3xl font-semibold tracking-tight sm:text-4xl",
          tone === "dark" ? "text-white" : "text-slate-950"
        )}
      >
        {title}
      </h2>
      {description ? (
        <p
          className={cn(
            "mt-4 text-base leading-7 sm:text-lg",
            tone === "dark" ? "text-emerald-50/72" : "text-slate-600"
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

function SiteHeader({
  user,
  authLoading,
}: {
  user: PublicShellUser | null;
  authLoading: boolean;
}) {
  const [location, setLocation] = useLocation();
  const { language, setLanguage } = useLanguage();
  const copy = shellCopy[language];
  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";
  const navigation = copy.navigation.filter(item => item.href !== "/admin" || isAdmin);
  const accountCopy =
    language === "ru"
      ? { login: "Войти", logout: "Выйти", signedIn: "Аккаунт" }
      : { login: "Sign in", logout: "Log out", signedIn: "Account" };
  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      utils.auth.me.setData(undefined, null);
      void utils.auth.me.invalidate();
      if (location.startsWith("/admin")) {
        setLocation("/");
      }
    },
  });

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-white/10 bg-[#0e2a1f] text-sm text-emerald-50/85">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm">{copy.topLine}</p>
          <div className="flex flex-wrap items-center gap-4 text-xs uppercase tracking-[0.18em] text-emerald-50/65">
            {copy.topTags.map(tag => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-emerald-950/10 bg-[rgba(247,244,235,0.86)] backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center justify-between gap-4">
            <Link href="/">
              <a className="flex items-center gap-3 text-slate-950 transition hover:text-emerald-900">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#133824] text-[#d8b26b] shadow-[0_14px_30px_-14px_rgba(14,42,31,0.7)]">
                  <Sprout className="h-5 w-5" />
                </span>
                <span>
                  <span className="block font-display text-lg font-semibold tracking-tight">
                    Field Review
                  </span>
                  <span className="block text-xs uppercase tracking-[0.24em] text-slate-500">
                    {copy.brandSubtitle}
                  </span>
                </span>
              </a>
            </Link>

            <div className="hidden rounded-full border border-emerald-950/10 bg-white/70 px-3 py-1 text-xs font-medium text-slate-500 lg:block">
              {copy.positioning}
            </div>
          </div>

          <nav className="flex flex-wrap items-center gap-2">
            {navigation.map(item => {
              const isActive =
                item.href === "/"
                  ? location === "/"
                  : location.startsWith(item.href);

              return (
                <Link key={item.href} href={item.href}>
                  <a
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      isActive
                        ? "bg-[#163d2b] text-white shadow-[0_18px_40px_-24px_rgba(22,61,43,0.9)]"
                        : "text-slate-600 hover:bg-white/80 hover:text-slate-950"
                    )}
                  >
                    {item.label}
                  </a>
                </Link>
              );
            })}
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <div
              aria-label={copy.languageLabel}
              className="flex items-center rounded-full border border-emerald-950/12 bg-white/70 p-1 text-xs font-semibold text-slate-600"
            >
              <Languages className="ml-2 mr-1 h-4 w-4 text-[#163d2b]" />
              {(["ru", "en"] as const).map(option => (
                <button
                  key={option}
                  type="button"
                  aria-pressed={language === option}
                  onClick={() => setLanguage(option)}
                  className={cn(
                    "rounded-full px-3 py-1.5 transition",
                    language === option
                      ? "bg-[#163d2b] text-white"
                      : "text-slate-500 hover:bg-white hover:text-slate-900"
                  )}
                >
                  {option.toUpperCase()}
                </button>
              ))}
            </div>
            {user ? (
              <button
                type="button"
                disabled={authLoading || logoutMutation.isPending}
                onClick={() => logoutMutation.mutate()}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-full border-emerald-950/15 bg-white/70 px-4 text-slate-700 hover:bg-white hover:text-slate-950"
                )}
                title={`${accountCopy.signedIn}: ${user.email ?? user.name ?? ""}`}
              >
                <LogOut className="h-4 w-4" />
                {accountCopy.logout}
              </button>
            ) : (
              <Link href="/auth">
                <a
                  className={cn(
                    buttonVariants({ variant: "outline" }),
                    "rounded-full border-emerald-950/15 bg-white/70 px-4 text-slate-700 hover:bg-white hover:text-slate-950"
                  )}
                >
                  <LogIn className="h-4 w-4" />
                  {accountCopy.login}
                </a>
              </Link>
            )}
            <Link href="/contact">
              <a
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "rounded-full border-emerald-950/15 bg-white/70 px-5 text-slate-700 hover:bg-white hover:text-slate-950"
                )}
              >
                {copy.contactCta}
              </a>
            </Link>
            <Link href="/forecast">
              <a
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "rounded-full bg-[#d1a25c] px-6 text-[#102919] hover:bg-[#c4944a]"
                )}
              >
                {copy.forecastCta}
                <ArrowRight className="h-4 w-4" />
              </a>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}

function SiteFooter({ isAdmin }: { isAdmin: boolean }) {
  const { language } = useLanguage();
  const copy = shellCopy[language].footer;
  const sectionLinks = copy.sectionLinks.filter(link => link.href !== "/admin" || isAdmin);

  return (
    <footer className="relative z-10 mt-16 border-t border-white/40 bg-[#102919] text-emerald-50/75">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 lg:grid-cols-[1.25fr_0.8fr_0.8fr_1fr]">
        <div>
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-[#d8b26b]">
              <Sprout className="h-5 w-5" />
            </span>
            <div>
              <p className="font-display text-xl font-semibold text-white">Field Review</p>
              <p className="text-sm text-emerald-50/60">{copy.brandSubtitle}</p>
            </div>
          </div>
          <p className="mt-5 max-w-md text-sm leading-7 text-emerald-50/70">
            {copy.description}
          </p>
        </div>

        <FooterColumn title={copy.solutionTitle} links={copy.solutionLinks} />
        <FooterColumn title={copy.sectionsTitle} links={sectionLinks} />

        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/50">
            {copy.contactsTitle}
          </p>
          <div className="mt-5 space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 text-[#d8b26b]" />
              <span>info@agrostream.net</span>
            </div>
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-4 w-4 text-[#d8b26b]" />
              <span>{copy.team}</span>
            </div>
            <div className="flex items-start gap-3">
              <MapPinned className="mt-0.5 h-4 w-4 text-[#d8b26b]" />
              <span>{copy.address}</span>
            </div>
            <div className="flex items-start gap-3">
              <Workflow className="mt-0.5 h-4 w-4 text-[#d8b26b]" />
              <span>{copy.workScope}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-5 text-sm text-emerald-50/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Field Review © {new Date().getFullYear()}. {copy.copyright}
          </p>
          <p>{copy.note}</p>
        </div>
      </div>
    </footer>
  );
}

type FooterColumnProps = {
  title: string;
  links: Array<{ href: string; label: string }>;
};

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div>
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-50/50">
        {title}
      </p>
      <div className="mt-5 space-y-3">
        {links.map(link => (
          <Link key={link.label} href={link.href}>
            <a className="block text-sm transition hover:text-white">{link.label}</a>
          </Link>
        ))}
      </div>
    </div>
  );
}
