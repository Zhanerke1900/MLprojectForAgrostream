import { SectionIntro, SiteShell } from "@/components/site/SiteShell";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage, type Language } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { BarChart3, ClipboardList, Database, Inbox } from "lucide-react";
import { Link } from "wouter";

type SavedFactor = {
  name: string;
  value: string;
  impact: "pos" | "neg" | "neu";
};

type SavedResult = {
  yield_avg: number;
  yield_min: number;
  yield_max: number;
  confidence: "high" | "medium" | "low";
  analysis: string;
  factors: SavedFactor[];
};

type SavedMaterial = {
  name: string;
  type: string;
  size: number;
};

const adminCopy: Record<Language, any> = {
  ru: {
    locale: "ru-RU",
    hero: {
      eyebrow: "Админка",
      title: "Заявки и история расчетов в одном рабочем экране",
      description:
        "Здесь можно смотреть входящие заявки, менять их статус и проверять последние расчетные сценарии.",
    },
    cards: {
      requests: "Всего заявок",
      newRequests: "Новые заявки",
      calculations: "Расчеты",
    },
    requests: {
      eyebrow: "Admin-заявки",
      title: "Входящие заявки",
      empty: "Заявок пока нет.",
      loading: "Загружаем заявки...",
      error: "Не удалось загрузить заявки. Проверьте подключение к базе.",
      columns: {
        date: "Дата",
        person: "ФИО",
        contact: "Контакт",
        country: "Страна",
        area: "Площадь",
        status: "Статус",
      },
    },
    history: {
      eyebrow: "История расчетов",
      title: "Последние расчетные сценарии",
      empty: "Истории расчетов пока нет.",
      loading: "Загружаем историю...",
      error: "Не удалось загрузить историю. Проверьте подключение к базе.",
      columns: {
        date: "Дата",
        crop: "Культура",
        area: "Площадь",
        inputs: "Ввод",
        yield: "Оценка",
        materials: "Материалы",
      },
      unit: "ц/га",
      files: "файлов",
    },
    statuses: {
      new: "Новая",
      in_progress: "В работе",
      contacted: "Связались",
      closed: "Закрыта",
    },
  },
  en: {
    locale: "en-US",
    hero: {
      eyebrow: "Admin",
      title: "Requests and calculation history in one working screen",
      description:
        "Review incoming requests, update their status, and check the latest assessment scenarios.",
    },
    cards: {
      requests: "Total requests",
      newRequests: "New requests",
      calculations: "Calculations",
    },
    requests: {
      eyebrow: "Admin requests",
      title: "Incoming requests",
      empty: "No requests yet.",
      loading: "Loading requests...",
      error: "Could not load requests. Check the database connection.",
      columns: {
        date: "Date",
        person: "Full name",
        contact: "Contact",
        country: "Country",
        area: "Area",
        status: "Status",
      },
    },
    history: {
      eyebrow: "Calculation history",
      title: "Latest assessment scenarios",
      empty: "No calculation history yet.",
      loading: "Loading history...",
      error: "Could not load history. Check the database connection.",
      columns: {
        date: "Date",
        crop: "Crop",
        area: "Area",
        inputs: "Inputs",
        yield: "Estimate",
        materials: "Materials",
      },
      unit: "c/ha",
      files: "files",
    },
    statuses: {
      new: "New",
      in_progress: "In progress",
      contacted: "Contacted",
      closed: "Closed",
    },
  },
};

const statusTone: Record<string, string> = {
  new: "bg-emerald-50 text-emerald-700 border-emerald-200",
  in_progress: "bg-amber-50 text-amber-700 border-amber-200",
  contacted: "bg-sky-50 text-sky-700 border-sky-200",
  closed: "bg-slate-100 text-slate-600 border-slate-200",
};

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function formatDate(value: Date | string, locale: string) {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatYield(value: number, locale: string) {
  return new Intl.NumberFormat(locale, {
    maximumFractionDigits: 1,
  }).format(value);
}

export default function Admin() {
  const { language } = useLanguage();
  const t = adminCopy[language];
  const utils = trpc.useUtils();
  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });
  const isAdmin = meQuery.data?.role === "admin";
  const requestsQuery = trpc.admin.listContactRequests.useQuery(undefined, {
    enabled: isAdmin,
  });
  const historyQuery = trpc.forecastHistory.list.useQuery(undefined, {
    enabled: isAdmin,
  });
  const updateStatus = trpc.admin.updateContactRequestStatus.useMutation({
    onSuccess: () => {
      void utils.admin.listContactRequests.invalidate();
    },
  });

  const requests = requestsQuery.data ?? [];
  const history = historyQuery.data ?? [];
  const newRequests = requests.filter(item => item.status === "new").length;

  if (meQuery.isLoading) {
    return (
      <SiteShell>
        <AdminAccessState title="Admin" text="Loading access..." />
      </SiteShell>
    );
  }

  if (!meQuery.data) {
    return (
      <SiteShell>
        <AdminAccessState
          title={language === "ru" ? "Нужен вход" : "Sign in required"}
          text={
            language === "ru"
              ? "Войдите в аккаунт администратора, чтобы открыть эту страницу."
              : "Sign in with an admin account to open this page."
          }
          action={language === "ru" ? "Войти" : "Sign in"}
        />
      </SiteShell>
    );
  }

  if (!isAdmin) {
    return (
      <SiteShell>
        <AdminAccessState
          title={language === "ru" ? "Нет доступа" : "No access"}
          text={
            language === "ru"
              ? "Эта страница доступна только администратору."
              : "This page is available only to an administrator."
          }
        />
      </SiteShell>
    );
  }

  return (
    <SiteShell>
      <section className="mx-auto max-w-7xl px-4 pb-8 pt-14 lg:pt-18">
        <div className="panel-surface p-7 sm:p-9">
          <SectionIntro
            eyebrow={t.hero.eyebrow}
            title={t.hero.title}
            description={t.hero.description}
          />

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <div className="metric-card">
              <div className="flex items-center gap-3">
                <Inbox className="h-5 w-5 text-[#163d2b]" />
                <p className="text-sm font-medium text-slate-500">{t.cards.requests}</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{requests.length}</p>
            </div>
            <div className="metric-card">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-5 w-5 text-[#163d2b]" />
                <p className="text-sm font-medium text-slate-500">{t.cards.newRequests}</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{newRequests}</p>
            </div>
            <div className="metric-card">
              <div className="flex items-center gap-3">
                <BarChart3 className="h-5 w-5 text-[#163d2b]" />
                <p className="text-sm font-medium text-slate-500">{t.cards.calculations}</p>
              </div>
              <p className="mt-3 text-3xl font-semibold text-slate-950">{history.length}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="panel-surface p-6 sm:p-8">
          <div className="flex items-center gap-3">
            <Database className="h-5 w-5 text-[#163d2b]" />
            <div>
              <p className="section-kicker">{t.requests.eyebrow}</p>
              <h2 className="mt-2 text-2xl font-semibold text-slate-950">
                {t.requests.title}
              </h2>
            </div>
          </div>

          <div className="mt-6">
            {requestsQuery.isLoading ? (
              <p className="text-sm text-slate-500">{t.requests.loading}</p>
            ) : requestsQuery.isError ? (
              <p className="rounded-2xl border border-red-500/12 bg-red-50 p-4 text-sm text-red-700">
                {t.requests.error}
              </p>
            ) : requests.length === 0 ? (
              <p className="text-sm text-slate-500">{t.requests.empty}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.requests.columns.date}</TableHead>
                    <TableHead>{t.requests.columns.person}</TableHead>
                    <TableHead>{t.requests.columns.contact}</TableHead>
                    <TableHead>{t.requests.columns.country}</TableHead>
                    <TableHead>{t.requests.columns.area}</TableHead>
                    <TableHead>{t.requests.columns.status}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(item => (
                    <TableRow key={item.id}>
                      <TableCell>{formatDate(item.createdAt, t.locale)}</TableCell>
                      <TableCell>
                        <div className="font-medium text-slate-900">{item.fullName}</div>
                        <div className="text-xs text-slate-500">{item.company || "-"}</div>
                      </TableCell>
                      <TableCell>
                        <div>{item.email}</div>
                        <div className="text-xs text-slate-500">{item.phone || "-"}</div>
                      </TableCell>
                      <TableCell>{item.country}</TableCell>
                      <TableCell>{item.area}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge className={`rounded-full border px-3 py-1 ${statusTone[item.status]}`}>
                            {t.statuses[item.status]}
                          </Badge>
                          <Select
                            value={item.status}
                            onValueChange={status =>
                              updateStatus.mutate({
                                id: item.id,
                                status: status as "new" | "in_progress" | "contacted" | "closed",
                              })
                            }
                          >
                            <SelectTrigger className="h-9 w-[150px] rounded-full bg-white">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(t.statuses).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label as string}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-4 pt-10">
        <div className="panel-surface p-6 sm:p-8">
          <div>
            <p className="section-kicker">{t.history.eyebrow}</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-950">
              {t.history.title}
            </h2>
          </div>

          <div className="mt-6">
            {historyQuery.isLoading ? (
              <p className="text-sm text-slate-500">{t.history.loading}</p>
            ) : historyQuery.isError ? (
              <p className="rounded-2xl border border-red-500/12 bg-red-50 p-4 text-sm text-red-700">
                {t.history.error}
              </p>
            ) : history.length === 0 ? (
              <p className="text-sm text-slate-500">{t.history.empty}</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.history.columns.date}</TableHead>
                    <TableHead>{t.history.columns.crop}</TableHead>
                    <TableHead>{t.history.columns.area}</TableHead>
                    <TableHead>{t.history.columns.inputs}</TableHead>
                    <TableHead>{t.history.columns.yield}</TableHead>
                    <TableHead>{t.history.columns.materials}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map(item => {
                    const savedResult = parseJson<SavedResult | null>(item.resultJson, null);
                    const savedMaterials = parseJson<SavedMaterial[]>(item.materialsJson, []);

                    return (
                      <TableRow key={item.id}>
                        <TableCell>{formatDate(item.createdAt, t.locale)}</TableCell>
                        <TableCell>
                          <div className="font-medium text-slate-900">{item.crop}</div>
                          <div className="text-xs text-slate-500">{item.variety}</div>
                        </TableCell>
                        <TableCell>{item.area}</TableCell>
                        <TableCell>
                          <div>SET/GDD: {item.set}</div>
                          <div className="text-xs text-slate-500">
                            P: {item.precipitation}, H: {item.humus || "-"}
                          </div>
                        </TableCell>
                        <TableCell>
                          {savedResult ? (
                            <div>
                              {formatYield(savedResult.yield_avg, t.locale)} {t.history.unit}
                              <div className="text-xs text-slate-500">
                                {formatYield(savedResult.yield_min, t.locale)} -{" "}
                                {formatYield(savedResult.yield_max, t.locale)}
                              </div>
                            </div>
                          ) : (
                            "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {savedMaterials.length} {t.history.files}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </section>
    </SiteShell>
  );
}

function AdminAccessState({
  title,
  text,
  action,
}: {
  title: string;
  text: string;
  action?: string;
}) {
  return (
    <section className="mx-auto max-w-3xl px-4 pb-8 pt-14 lg:pt-18">
      <div className="panel-surface p-7 sm:p-9">
        <SectionIntro eyebrow="Admin" title={title} description={text} />
        {action ? (
          <Link href="/auth?next=/admin">
            <a className="mt-7 inline-flex h-12 items-center justify-center rounded-full bg-[#163d2b] px-6 text-sm font-semibold text-white hover:bg-[#112d20]">
              {action}
            </a>
          </Link>
        ) : null}
      </div>
    </section>
  );
}
