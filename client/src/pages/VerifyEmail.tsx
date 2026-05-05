import { SectionIntro, SiteShell } from "@/components/site/SiteShell";
import { Button } from "@/components/ui/button";
import { useLanguage, type Language } from "@/lib/i18n";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, MailWarning } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

const verifyCopy: Record<Language, any> = {
  ru: {
    loading: {
      eyebrow: "Email",
      title: "Подтверждаем почту",
      description: "Проверяем ссылку и открываем аккаунт.",
    },
    success: {
      eyebrow: "Email",
      title: "Почта подтверждена",
      description: "Аккаунт активирован. Сейчас перенаправим вас дальше.",
    },
    error: {
      eyebrow: "Email",
      title: "Ссылка не сработала",
      description: "Ссылка подтверждения устарела или уже была использована.",
    },
    missingToken: "В ссылке нет токена подтверждения.",
    back: "Вернуться ко входу",
  },
  en: {
    loading: {
      eyebrow: "Email",
      title: "Confirming your email",
      description: "We are checking the link and opening your account.",
    },
    success: {
      eyebrow: "Email",
      title: "Email confirmed",
      description: "Your account is active. Redirecting you now.",
    },
    error: {
      eyebrow: "Email",
      title: "The link did not work",
      description: "The verification link is expired or has already been used.",
    },
    missingToken: "The verification token is missing.",
    back: "Back to sign in",
  },
};

function getVerifyToken() {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get("token") ?? "";
}

export default function VerifyEmail() {
  const { language } = useLanguage();
  const t = verifyCopy[language];
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const token = useMemo(getVerifyToken, []);
  const [error, setError] = useState<string | null>(token ? null : t.missingToken);
  const [success, setSuccess] = useState(false);
  const verifyMutation = trpc.auth.verifyEmail.useMutation();

  useEffect(() => {
    if (!token || verifyMutation.isPending || success || error) return;

    let isMounted = true;

    verifyMutation
      .mutateAsync({ token })
      .then(async result => {
        if (!isMounted) return;

        await utils.auth.me.invalidate();
        setSuccess(true);
        window.setTimeout(() => {
          setLocation(result.user.role === "admin" ? "/admin" : "/forecast");
        }, 900);
      })
      .catch(() => {
        if (isMounted) {
          setError(t.error.description);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [error, setLocation, success, t.error.description, token, utils.auth.me, verifyMutation]);

  const state = error ? t.error : success ? t.success : t.loading;

  return (
    <SiteShell>
      <section className="mx-auto max-w-3xl px-4 pb-8 pt-14 lg:pt-18">
        <div className="panel-surface p-7 sm:p-9">
          <SectionIntro
            eyebrow={state.eyebrow}
            title={state.title}
            description={error ?? state.description}
          />

          <div className="mt-8 flex items-center gap-3 text-[#163d2b]">
            {error ? (
              <MailWarning className="h-6 w-6 text-red-600" />
            ) : success ? (
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            ) : (
              <Loader2 className="h-6 w-6 animate-spin" />
            )}
            <span className="text-sm font-medium">
              {error ? state.title : success ? state.title : state.description}
            </span>
          </div>

          {error ? (
            <Link href="/auth">
              <Button className="mt-7 h-12 rounded-full bg-[#163d2b] px-6 text-white hover:bg-[#112d20]">
                {t.back}
              </Button>
            </Link>
          ) : null}
        </div>
      </section>
    </SiteShell>
  );
}
